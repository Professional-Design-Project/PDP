import asyncio
import time
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from pipecat.frames.frames import (
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    TTSAudioRawFrame,
    TTSStoppedFrame,
)
from pipecat.processors.frame_processor import FrameDirection

from voicebot.application.interviews import INTERVIEW_SCENARIOS
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
async def conversation(request):
    session = SimpleNamespace(
        id="session",
        model="test-model",
        instructions="test",
        language="en",
        scenario_id=getattr(request, "param", "oral-exam"),
    )
    conversation = GeminiConversation(
        session, Mock(), Settings(_env_file=None, google_api_key="test-key")
    )
    conversation.llm.set_audio_input_paused = Mock()
    conversation.completion.push_frame = AsyncMock()

    async def after_output(frame, direction=FrameDirection.DOWNSTREAM):
        await conversation.completion.process_frame(frame, FrameDirection.DOWNSTREAM)

    conversation.closing_audio.push_frame = AsyncMock(side_effect=after_output)

    async def push(frame):
        await conversation.closing_audio.process_frame(frame, FrameDirection.DOWNSTREAM)

    conversation.llm.push_frame = AsyncMock(side_effect=push)
    conversation.transport = Events()
    conversation.user = Events()
    conversation.assistant = Events()
    conversation.assistant.push_frame = AsyncMock(side_effect=after_output)
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


async def call_prepare(conversation, arguments=None):
    result = AsyncMock()
    await conversation._prepare_closing(
        SimpleNamespace(arguments=arguments or {}, result_callback=result)
    )
    return result


@pytest.mark.parametrize("conversation", sorted(INTERVIEW_SCENARIOS), indirect=True)
async def test_each_interview_stage_requires_closing_confirmation(conversation):
    conversation._ready_at = time.monotonic() - 800
    conversation._user_turns = 10
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None
    result = await call_prepare(conversation)
    assert result.call_args.args[0]["status"] == "awaiting_candidate"


@pytest.fixture
async def running_interview(conversation):
    conversation._is_interview = True
    conversation._ready_at = time.monotonic() - 600
    conversation._user_turns = 8
    stop = asyncio.Event()
    task = asyncio.create_task(conversation.run(stop, AsyncMock(), AsyncMock(), AsyncMock()))
    await conversation.started.wait()
    try:
        yield conversation
    finally:
        stop.set()
        await asyncio.wait_for(task, 1)


async def assistant_says(conversation, content, *, interrupted=False):
    await conversation.assistant.emit(
        "on_assistant_turn_stopped",
        SimpleNamespace(content=content, interrupted=interrupted, timestamp="now"),
    )


async def candidate_says(conversation, content):
    await conversation.user.emit(
        "on_user_turn_message_added", SimpleNamespace(content=content, timestamp="now")
    )


@pytest.mark.parametrize("elapsed,turns", [(120, 8), (400, 3), (299, 6), (719, 5)])
async def test_premature_interview_completion_keeps_microphone_and_conversation_open(
    conversation, elapsed, turns
):
    conversation._is_interview = True
    conversation._ready_at = time.monotonic() - elapsed
    conversation._user_turns = turns
    result = AsyncMock()
    await conversation._finish_session(
        SimpleNamespace(arguments={"reason": "scenario_completed"}, result_callback=result)
    )
    assert result.call_args.args[0]["status"] == "continue_interview"
    assert result.call_args.kwargs["properties"].run_llm is True
    assert conversation._end_reason is None
    conversation.llm.set_audio_input_paused.assert_not_called()
    conversation.llm.push_frame.assert_not_awaited()


@pytest.mark.parametrize("elapsed,turns", [(300, 6), (720, 2)])
async def test_substantive_or_long_interview_can_close(conversation, elapsed, turns):
    conversation._is_interview = True
    conversation._ready_at = time.monotonic() - elapsed
    conversation._user_turns = turns
    await call_prepare(conversation)
    conversation._closing_confirmation.assistant_turn_finished(turns, interrupted=False)
    conversation._user_turns += 1
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason == ConversationEndReason.SCENARIO_COMPLETED
    conversation.llm.set_audio_input_paused.assert_called_once_with(True)


async def test_interview_cannot_finish_without_preparing_confirmation(running_interview):
    properties = await call_finish(running_interview, {"reason": "scenario_completed"})
    assert properties.run_llm is True
    assert running_interview._end_reason is None
    running_interview.llm.set_audio_input_paused.assert_not_called()


async def test_closing_requires_spoken_invitation_then_a_new_candidate_turn(running_interview):
    conversation = running_interview
    result = await call_prepare(conversation)
    assert result.call_args.args[0]["status"] == "awaiting_candidate"
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None

    await assistant_says(conversation, "Do you have any further questions?")
    properties = await call_finish(conversation, {"reason": "scenario_completed"})
    assert properties.run_llm is False
    assert conversation._end_reason is None
    await candidate_says(conversation, " ")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None
    conversation.llm.set_audio_input_paused.assert_not_called()

    await candidate_says(conversation, "No, that is all. Thank you.")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason == ConversationEndReason.SCENARIO_COMPLETED


async def test_candidate_turn_before_invitation_finishes_is_not_confirmation(running_interview):
    conversation = running_interview
    await call_prepare(conversation)
    await candidate_says(conversation, "One more thing.")
    await assistant_says(conversation, "What would you like to ask?")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None
    conversation.llm.set_audio_input_paused.assert_not_called()


@pytest.mark.parametrize("interrupted,content", [(True, "Any other"), (False, "")])
async def test_unfinished_or_empty_invitation_cannot_enable_closing(
    running_interview, interrupted, content
):
    conversation = running_interview
    await call_prepare(conversation)
    await assistant_says(conversation, content, interrupted=interrupted)
    await candidate_says(conversation, "No.")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None
    conversation.llm.set_audio_input_paused.assert_not_called()


async def test_answering_candidate_question_requires_a_fresh_closing_invitation(
    running_interview,
):
    conversation = running_interview
    await call_prepare(conversation)
    await assistant_says(conversation, "Do you have any questions?")
    await candidate_says(conversation, "How big is the team?")
    await assistant_says(conversation, "I do not have the confirmed team size.")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None

    await call_prepare(conversation)
    await assistant_says(conversation, "Anything else you would like to ask?")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason is None
    await candidate_says(conversation, "That is everything, thanks.")
    await call_finish(conversation, {"reason": "scenario_completed"})
    assert conversation._end_reason == ConversationEndReason.SCENARIO_COMPLETED


async def test_prepare_closing_rejects_arguments_without_arming_confirmation(running_interview):
    result = await call_prepare(running_interview, {"confirmed": True})
    assert "error" in result.call_args.args[0]
    assert result.call_args.kwargs["properties"].run_llm is False
    assert running_interview._closing_confirmation.prepared is False


async def test_prepare_closing_cannot_skip_interview_progress(conversation):
    conversation._is_interview = True
    result = await call_prepare(conversation)
    assert result.call_args.args[0]["status"] == "continue_interview"
    assert conversation._closing_confirmation.prepared is False


async def test_user_can_stop_while_waiting_for_closing_confirmation(running_interview):
    await call_prepare(running_interview)
    await assistant_says(running_interview, "Do you have any questions?")
    await call_finish(running_interview, {"reason": "user_ended"})
    assert running_interview._end_reason == ConversationEndReason.USER_ENDED


async def test_prepare_after_completion_does_not_restart_the_interview(running_interview):
    await call_finish(running_interview, {"reason": "user_ended"})
    result = await call_prepare(running_interview)
    assert result.call_args.args[0]["status"] == "already_closing"
    assert result.call_args.kwargs["properties"].run_llm is False


async def test_user_can_stop_an_interview_immediately(conversation):
    conversation._is_interview = True
    await call_finish(conversation, {"reason": "user_ended"})
    assert conversation._end_reason == ConversationEndReason.USER_ENDED


async def test_interview_progress_starts_when_ready_and_counts_nonempty_candidate_turns(
    conversation,
):
    conversation._is_interview = True
    conversation.worker.queue_frame = AsyncMock()
    conversation.context.add_message = Mock()
    stop = asyncio.Event()
    task = asyncio.create_task(conversation.run(stop, AsyncMock(), AsyncMock(), AsyncMock()))
    await conversation.started.wait()
    await conversation.worker.emit("on_pipeline_started", None)
    assert conversation._ready_at is None
    await conversation.transport.emit("on_client_connected", None)
    assert conversation._ready_at is not None
    for content in (" ", "I organised an event.", "My task was finding a venue."):
        await conversation.user.emit(
            "on_user_turn_message_added", SimpleNamespace(content=content, timestamp="now")
        )
    assert conversation._user_turns == 2
    stop.set()
    await asyncio.wait_for(task, 1)


@pytest.mark.parametrize("reason", list(ConversationEndReason))
@pytest.mark.parametrize("saved_first", [False, True])
async def test_completion_waits_for_final_transcript_and_output(conversation, reason, saved_first):
    completed = AsyncMock()
    transcript = AsyncMock()
    task = asyncio.create_task(
        conversation.run(asyncio.Event(), AsyncMock(), transcript, completed)
    )
    await conversation.started.wait()
    properties = await call_finish(conversation, {"reason": reason.value})
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await conversation.llm.push_frame(TTSAudioRawFrame(b"\x01\x00" * 2400, 24000, 1))
    await conversation.llm.push_frame(TTSStoppedFrame())
    message = SimpleNamespace(content="Goodbye.", interrupted=False, timestamp="now")

    if saved_first:
        await conversation.assistant.emit("on_assistant_turn_stopped", message)
        completed.assert_not_awaited()
        await conversation.llm.push_frame(LLMFullResponseEndFrame())
    else:
        await conversation.llm.push_frame(LLMFullResponseEndFrame())
        assert not conversation.completion.completed.is_set()
        completed.assert_not_awaited()
        await conversation.assistant.emit("on_assistant_turn_stopped", message)

    await asyncio.wait_for(task, 1)

    transcript.assert_awaited_once_with("assistant", "Goodbye.", False, "now")
    completed.assert_awaited_once_with(reason, conversation.closing_audio.wav)
    conversation.llm.set_audio_input_paused.assert_called_once_with(True)
    conversation.worker.stop_when_done.assert_awaited_once()
    conversation.runner.cancel.assert_not_awaited()
    assert properties.run_llm is True


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
    first = await call_finish(conversation, {"reason": "scenario_completed"})
    duplicate = await call_finish(conversation, {"reason": "user_ended"})
    assert conversation._end_reason == ConversationEndReason.SCENARIO_COMPLETED
    conversation.llm.set_audio_input_paused.assert_called_once_with(True)
    assert first.run_llm is True
    assert duplicate.run_llm is False


@pytest.mark.parametrize("failure", [False, True])
async def test_interruption_takes_precedence_over_pending_completion(conversation, failure):
    stop = asyncio.Event()
    completed = AsyncMock()
    task = asyncio.create_task(conversation.run(stop, AsyncMock(), AsyncMock(), completed))
    await conversation.started.wait()
    await call_finish(conversation, {"reason": "scenario_completed"})
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
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
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await conversation.llm.push_frame(TTSAudioRawFrame(b"\x01\x00" * 2400, 24000, 1))
    await conversation.llm.push_frame(TTSStoppedFrame())
    await conversation.assistant.emit(
        "on_assistant_turn_stopped",
        SimpleNamespace(content="Goodbye.", interrupted=False, timestamp="now"),
    )
    await conversation.llm.push_frame(LLMFullResponseEndFrame())
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
    await call_finish(conversation, {"reason": "scenario_completed"})
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await conversation.llm.push_frame(TTSAudioRawFrame(b"\x01\x00" * 2400, 24000, 1))
    await conversation.llm.push_frame(TTSStoppedFrame())
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
    completed.assert_awaited_once_with(
        ConversationEndReason.SCENARIO_COMPLETED, conversation.closing_audio.wav
    )


async def test_closing_waits_for_tts_after_llm_response(conversation):
    completed = AsyncMock()
    task = asyncio.create_task(
        conversation.run(asyncio.Event(), AsyncMock(), AsyncMock(), completed)
    )
    await conversation.started.wait()
    await call_finish(conversation, {"reason": "scenario_completed"})
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await conversation.llm.push_frame(LLMFullResponseEndFrame())
    await conversation.assistant.emit(
        "on_assistant_turn_stopped",
        SimpleNamespace(content="Goodbye.", interrupted=False, timestamp="now"),
    )
    assert not conversation.completion.completed.is_set()
    await conversation.llm.push_frame(TTSAudioRawFrame(b"\x01\x00" * 2400, 24000, 1))
    assert not conversation.completion.completed.is_set()
    await conversation.llm.push_frame(TTSStoppedFrame())
    await asyncio.wait_for(task, 1)
    completed.assert_awaited_once_with(
        ConversationEndReason.SCENARIO_COMPLETED, conversation.closing_audio.wav
    )


async def test_closing_tool_called_during_response_captures_remaining_audio(conversation):
    completed = AsyncMock()
    task = asyncio.create_task(
        conversation.run(asyncio.Event(), AsyncMock(), AsyncMock(), completed)
    )
    await conversation.started.wait()
    await conversation.llm.push_frame(LLMFullResponseStartFrame())
    await call_finish(conversation, {"reason": "scenario_completed"})
    await conversation.llm.push_frame(TTSAudioRawFrame(b"\x01\x00" * 2400, 24000, 1))
    await conversation.llm.push_frame(TTSStoppedFrame())
    await conversation.llm.push_frame(LLMFullResponseEndFrame())
    await conversation.assistant.emit(
        "on_assistant_turn_stopped",
        SimpleNamespace(content="Goodbye.", interrupted=False, timestamp="now"),
    )
    await asyncio.wait_for(task, 1)
    completed.assert_awaited_once_with(
        ConversationEndReason.SCENARIO_COMPLETED, conversation.closing_audio.wav
    )
