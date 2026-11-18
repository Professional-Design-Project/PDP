import asyncio
from collections.abc import Awaitable, Callable
from contextlib import suppress

from pipecat.adapters.llm.schemas.function_schema import FunctionSchema
from pipecat.adapters.llm.schemas.tools_schema import ToolsSchema
from pipecat.frames.frames import FunctionCallResultProperties, LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker, ProcessorUnusablePolicy
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    AssistantTurnStoppedMessage,
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
    UserTurnMessageAddedMessage,
)
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService
from pipecat.services.llm_service import FunctionCallParams
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.turns.user_turn_strategies import ExternalUserTurnStrategies
from pipecat.workers.runner import WorkerRunner

from voicebot.domain.session import ConversationEndReason, Session, Speaker
from voicebot.infrastructure.voice.completion import (
    AssistantTranscriptSavedFrame,
    BeginClosingFrame,
    ClosingAudio,
    ConversationCompletion,
)
from voicebot.settings import Settings


class VoiceUnavailable(Exception):
    pass


class ProviderFailed(Exception):
    pass


class GeminiConversation:
    def __init__(
        self,
        session: Session,
        connection: SmallWebRTCConnection,
        settings: Settings,
    ) -> None:
        key = settings.google_api_key.get_secret_value()
        if not key:
            raise VoiceUnavailable("Gemini API key is not configured")
        self.transport = SmallWebRTCTransport(
            webrtc_connection=connection,
            params=TransportParams(audio_in_enabled=True, audio_out_enabled=True),
        )
        self.llm = GeminiLiveLLMService(
            api_key=key,
            settings=GeminiLiveLLMService.Settings(
                model=session.model,
                system_instruction=session.instructions,
                voice=settings.gemini_voice,
                language=Language(session.language),
                context_window_compression={"enabled": True},
            ),
        )
        self.context = LLMContext(
            tools=ToolsSchema(
                standard_tools=[
                    FunctionSchema(
                        name="finish_session",
                        description="Request the end of the meeting BEFORE saying goodbye. "
                        "After the tool succeeds, say one brief closing statement, "
                        "then remain silent.",
                        properties={
                            "reason": {
                                "type": "string",
                                "enum": [reason.value for reason in ConversationEndReason],
                            }
                        },
                        required=["reason"],
                    )
                ]
            )
        )
        self.llm.register_function("finish_session", self._finish_session)
        self.user, self.assistant = LLMContextAggregatorPair(
            self.context,
            user_params=LLMUserAggregatorParams(user_turn_strategies=ExternalUserTurnStrategies()),
        )
        self.completion = ConversationCompletion()
        self.closing_audio = ClosingAudio()
        pipeline = Pipeline(
            [
                self.transport.input(),
                self.user,
                self.llm,
                self.closing_audio,
                self.transport.output(),
                self.assistant,
                self.completion,
            ]
        )
        self.worker = PipelineWorker(
            pipeline,
            conversation_id=session.id,
            params=PipelineParams(enable_metrics=True, enable_usage_metrics=True),
            processor_unusable_policy=ProcessorUnusablePolicy.CANCEL,
            idle_timeout_secs=None,
            cancel_timeout_secs=3,
        )
        self.runner = WorkerRunner(handle_sigint=False, handle_sigterm=False)
        self.failed = False
        self._end_reason: ConversationEndReason | None = None

    async def _finish_session(self, params: FunctionCallParams) -> None:
        try:
            if set(params.arguments) != {"reason"}:
                raise ValueError
            reason = ConversationEndReason(params.arguments["reason"])
        except (ValueError, TypeError):
            await params.result_callback(
                {"error": "Expected only reason: scenario_completed or user_ended"},
                properties=FunctionCallResultProperties(run_llm=False),
            )
            return
        if self._end_reason is not None:
            await params.result_callback(
                {"status": "already_closing"},
                properties=FunctionCallResultProperties(run_llm=False),
            )
            return
        self._end_reason = reason
        self.llm.set_audio_input_paused(True)
        await self.llm.push_frame(BeginClosingFrame(reason))
        await params.result_callback(
            {
                "status": "closing",
                "instruction": "Say one brief goodbye in character now, then remain silent.",
            },
            properties=FunctionCallResultProperties(run_llm=True),
        )

    async def run(
        self,
        stop: asyncio.Event,
        on_ready: Callable[[], Awaitable[None]],
        on_transcript: Callable[[Speaker, str, bool, str], Awaitable[None]],
        on_completed: Callable[[ConversationEndReason, bytes], Awaitable[None]],
    ) -> None:
        pipeline_ready = False
        client_connected = False
        notified = False

        async def notify_ready():
            nonlocal notified
            if pipeline_ready and client_connected and not notified:
                notified = True
                await on_ready()

        @self.transport.event_handler("on_client_connected")
        async def connected(transport, client):
            nonlocal client_connected
            client_connected = True
            await notify_ready()
            self.context.add_message(
                {"role": "developer", "content": "Begin the meeting with a brief greeting in role."}
            )
            await self.worker.queue_frame(LLMRunFrame())

        @self.worker.event_handler("on_pipeline_started")
        async def started(worker, frame):
            nonlocal pipeline_ready
            pipeline_ready = True
            await notify_ready()

        @self.worker.event_handler("on_pipeline_error")
        async def error(worker, frame):
            if frame.processor and not frame.processor.is_usable:
                self.failed = True
                await self.runner.cancel()

        @self.worker.event_handler("on_pipeline_timeout")
        @self.worker.event_handler("on_setup_timeout")
        async def timed_out(worker, *args):
            self.failed = True
            await self.runner.cancel()

        @self.user.event_handler("on_user_turn_message_added")
        async def user_transcript(aggregator, message: UserTurnMessageAddedMessage):
            await on_transcript("user", message.content, False, message.timestamp)

        @self.assistant.event_handler("on_assistant_turn_stopped")
        async def assistant_transcript(aggregator, message: AssistantTurnStoppedMessage):
            await on_transcript(
                "assistant", message.content, message.interrupted, message.timestamp
            )
            await self.assistant.push_frame(AssistantTranscriptSavedFrame())

        await self.runner.add_workers(self.worker)
        run_task = asyncio.create_task(self.runner.run())
        stop_task = asyncio.create_task(stop.wait())
        completion_task = asyncio.create_task(self.completion.completed.wait())
        try:
            await asyncio.wait(
                (run_task, stop_task, completion_task), return_when=asyncio.FIRST_COMPLETED
            )
            if (
                completion_task.done()
                and not stop.is_set()
                and not run_task.done()
                and not self.failed
                and self.completion.reason is not None
            ):
                await on_completed(self.completion.reason, self.closing_audio.wav)
                if not stop.is_set():
                    await self.worker.stop_when_done()
                    await asyncio.wait((run_task, stop_task), return_when=asyncio.FIRST_COMPLETED)
        finally:
            if not run_task.done():
                await self.runner.cancel()
            for task in (stop_task, completion_task):
                task.cancel()
                with suppress(asyncio.CancelledError):
                    await task
            await run_task
        if self.failed:
            raise ProviderFailed
