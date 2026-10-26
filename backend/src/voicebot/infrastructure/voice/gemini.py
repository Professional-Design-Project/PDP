import asyncio
from collections.abc import Awaitable, Callable
from contextlib import suppress

from pipecat.frames.frames import LLMRunFrame
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
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.turns.user_turn_strategies import ExternalUserTurnStrategies
from pipecat.workers.runner import WorkerRunner

from voicebot.domain.session import Session, Speaker
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
                language=session.language,
                context_window_compression={"enabled": True},
            ),
        )
        self.context = LLMContext()
        self.user, self.assistant = LLMContextAggregatorPair(
            self.context,
            user_params=LLMUserAggregatorParams(user_turn_strategies=ExternalUserTurnStrategies()),
        )
        pipeline = Pipeline(
            [
                self.transport.input(),
                self.user,
                self.llm,
                self.transport.output(),
                self.assistant,
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

    async def run(
        self,
        stop: asyncio.Event,
        on_ready: Callable[[], Awaitable[None]],
        on_transcript: Callable[[Speaker, str, bool, str], Awaitable[None]],
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

        await self.runner.add_workers(self.worker)
        run_task = asyncio.create_task(self.runner.run())
        stop_task = asyncio.create_task(stop.wait())
        try:
            await asyncio.wait((run_task, stop_task), return_when=asyncio.FIRST_COMPLETED)
        finally:
            await self.runner.cancel()
            stop_task.cancel()
            with suppress(asyncio.CancelledError):
                await stop_task
            await run_task
        if self.failed:
            raise ProviderFailed
