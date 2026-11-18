import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from pipecat.frames.frames import LLMFullResponseEndFrame, LLMFullResponseStartFrame
from pipecat.processors.frame_processor import FrameDirection

from voicebot.domain.session import ConversationEndReason
from voicebot.infrastructure.voice.gemini import GeminiConversation, ProviderFailed
from voicebot.settings import Settings


class Events:
    def __init__(self):
        self.handlers = {}

    def event_handler(self, name, **kwargs):
        def register(handler):
            self.handlers[name] = handler
            return handler

        return register

    async def emit(self, name, *args):
        await self.handlers[name](self, *args)


@pytest.fixture
async def conversation():
    session = SimpleNamespace(id="session", model="test-model", instructions="test", language="en")
    conversation = GeminiConversation(
        session, Mock(), Settings(_env_file=None, google_api_key="test-key")
    )
    conversation.llm.set_audio_input_paused = Mock()
    conversation.completion.push_frame = AsyncMock()

    async def push(frame):
        await conversation.completion.process_frame(frame, FrameDirection.DOWNSTREAM)

    conversation.llm.push_frame = AsyncMock(side_effect=push)
    conversation.transport = Events()
    conversation.user = Events()
    conversation.assistant = Events()
    conversation.assistant.push_frame = AsyncMock(side_effect=push)
    conversation.worker = Events()
    started = asyncio.Event()
    ended = asyncio.Event()

    async def run():
        started.set()
        await ended.wait()

    conversation.runner = SimpleNamespace(
        add_workers=AsyncMock(), run=run, cancel=AsyncMock(side_effect=ended.set)
    )
    conversation.worker.stop_when_done = AsyncMock(side_effect=ended.set)
    conversation.started = started
    return conversation


async def call_finish(conversation, arguments):
    result = AsyncMock()
    await conversation._finish_session(SimpleNamespace(arguments=arguments, result_callback=result))
    return result.call_args.kwargs["properties"]


@pytest.mark.parametrize("reason", list(ConversationEndReason))
@pytest.mark.parametrize("tool_first", [False, True])
async def test_completion_waits_for_final_transcript_and_output(conversation, reason, tool_first):
    completed = AsyncMock()
    transcript = AsyncMock()
    task = asyncio.create_task(
        conversation.run(asyncio.Event(), AsyncMock(), transcript, completed)
    )
    await conversation.started.wait()
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    message = SimpleNamespace(content="Goodbye.", interrupted=False, timestamp="now")

    if tool_first:
        properties = await call_finish(conversation, {"reason": reason.value})
        assert not conversation.completion.completed.is_set()
        completed.assert_not_awaited()
        await conversation.assistant.emit("on_assistant_turn_stopped", message)
        await conversation.llm.push_frame(LLMFullResponseEndFrame())
    else:
        await conversation.assistant.emit("on_assistant_turn_stopped", message)
        await conversation.llm.push_frame(LLMFullResponseEndFrame())
        properties = await call_finish(conversation, {"reason": reason.value})

    await asyncio.wait_for(task, 1)

    transcript.assert_awaited_once_with("assistant", "Goodbye.", False, "now")
    completed.assert_awaited_once_with(reason)
    conversation.llm.set_audio_input_paused.assert_called_once_with(True)
    conversation.worker.stop_when_done.assert_awaited_once()
    conversation.runner.cancel.assert_not_awaited()
    assert properties.run_llm is False


@pytest.mark.parametrize(
    "arguments",
    [
        {},
        {"reason": "runtime_failed"},
        {"reason": []},
        {"reason": "scenario_completed", "session_id": "other"},
    ],
)
async def test_invalid_tool_arguments_cannot_end_session(conversation, arguments):
    properties = await call_finish(conversation, arguments)
    assert properties.run_llm is False
    assert conversation._end_reason is None
    assert not conversation.completion.completed.is_set()
    conversation.llm.set_audio_input_paused.assert_not_called()


async def test_duplicate_tool_calls_keep_first_reason(conversation):
    await call_finish(conversation, {"reason": "scenario_completed"})
    await call_finish(conversation, {"reason": "user_ended"})
    assert conversation._end_reason == ConversationEndReason.SCENARIO_COMPLETED
    conversation.llm.set_audio_input_paused.assert_called_once_with(True)


@pytest.mark.parametrize("failure", [False, True])
async def test_interruption_takes_precedence_over_pending_completion(conversation, failure):
    stop = asyncio.Event()
    completed = AsyncMock()
    task = asyncio.create_task(conversation.run(stop, AsyncMock(), AsyncMock(), completed))
    await conversation.started.wait()
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await call_finish(conversation, {"reason": "scenario_completed"})
    if failure:
        await conversation.worker.emit("on_pipeline_timeout")
        with pytest.raises(ProviderFailed):
            await asyncio.wait_for(task, 1)
    else:
        stop.set()
        await asyncio.wait_for(task, 1)
    completed.assert_not_awaited()
    conversation.worker.stop_when_done.assert_not_awaited()


async def test_finalization_failure_cleans_up_without_graceful_completion(conversation):
    completed = AsyncMock(side_effect=RuntimeError("storage failed"))
    task = asyncio.create_task(
        conversation.run(asyncio.Event(), AsyncMock(), AsyncMock(), completed)
    )
    await conversation.started.wait()
    await call_finish(conversation, {"reason": "scenario_completed"})
    with pytest.raises(RuntimeError, match="storage failed"):
        await asyncio.wait_for(task, 1)
    conversation.runner.cancel.assert_awaited_once()
    conversation.worker.stop_when_done.assert_not_awaited()


async def test_completion_waits_for_transcript_storage(conversation):
    saved = asyncio.Event()
    saving = asyncio.Event()

    async def transcript(*args):
        saving.set()
        await saved.wait()

    completed = AsyncMock()
    task = asyncio.create_task(
        conversation.run(asyncio.Event(), AsyncMock(), transcript, completed)
    )
    await conversation.started.wait()
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await call_finish(conversation, {"reason": "scenario_completed"})
    transcript_task = asyncio.create_task(
        conversation.assistant.emit(
            "on_assistant_turn_stopped",
            SimpleNamespace(content="Goodbye.", interrupted=False, timestamp="now"),
        )
    )
    await saving.wait()
    await conversation.llm.push_frame(LLMFullResponseEndFrame())
    assert not conversation.completion.completed.is_set()
    completed.assert_not_awaited()
    saved.set()
    await transcript_task
    await asyncio.wait_for(task, 1)
    completed.assert_awaited_once_with(ConversationEndReason.SCENARIO_COMPLETED)
