import asyncio
import base64
import io
import json
import wave
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from aiortc import RTCConfiguration, RTCPeerConnection, RTCSessionDescription
from pipecat.frames.frames import (
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    TextType,
    TTSAudioRawFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
    TTSTextFrame,
)

from voicebot.application.documents import Document
from voicebot.application.sessions import Sessions
from voicebot.domain.session import ConversationEndReason, SessionConflict
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.infrastructure.voice.active_session import ActiveSession
from voicebot.infrastructure.voice.gemini import GeminiConversation
from voicebot.infrastructure.voice.runtime import VoiceRuntime
from voicebot.infrastructure.voice.webrtc import Offer
from voicebot.settings import Settings


async def test_runtime_passes_document_brief_to_gemini_without_storing_it(tmp_path, monkeypatch):
    database = await Database.open(tmp_path / "runtime.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        document = Document("cv.txt", "cv", "Built a payments ledger in Kotlin.")
        session, _ = await sessions.create(
            "job-interview", "en", "Backend role", documents=(document,)
        )
        conversation = Mock(run=AsyncMock())
        factory = Mock(return_value=conversation)
        monkeypatch.setattr("voicebot.infrastructure.voice.runtime.GeminiConversation", factory)
        entry = SimpleNamespace(stop=asyncio.Event(), connection=object())
        runtime = VoiceRuntime(sessions, Settings(_env_file=None))

        await runtime._serve(session.id, entry)

        supplied = factory.call_args.args[0]
        assert supplied.instructions == (await sessions.for_conversation(session.id)).instructions
        assert document.text in supplied.instructions
        assert "Backend role" in supplied.instructions
        assert "Stay in character" in supplied.instructions
        assert document.text not in (await database.get(session.id)).instructions
        conversation.run.assert_awaited_once()
    finally:
        await database.close()


async def test_real_webrtc_signaling_and_cleanup(tmp_path, monkeypatch):
    database = await Database.open(tmp_path / "runtime.sqlite3")
    sessions = Sessions(database, load_scenarios(), "test-model")
    runtime = VoiceRuntime(sessions, Settings(_env_file=None, google_api_key="test-key"))

    async def serve(session_id, entry):
        await entry.connection.connect()
        await entry.stop.wait()

    monkeypatch.setattr(runtime, "_serve", serve)
    peer = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    connected = asyncio.Event()

    @peer.on("connectionstatechange")
    def connection_changed():
        if peer.connectionState == "connected":
            connected.set()

    try:
        peer.addTransceiver("audio", direction="sendrecv")
        peer.createDataChannel("rtvi-ai")
        await peer.setLocalDescription(await peer.createOffer())
        session, _ = await sessions.create("job-interview", "pl")
        offer = Offer(sdp=peer.localDescription.sdp, type="offer")
        answer = await runtime.offer(session.id, offer)
        with pytest.raises(SessionConflict):
            await runtime.offer(session.id, offer)
        await peer.setRemoteDescription(RTCSessionDescription(sdp=answer.sdp, type=answer.type))
        async with asyncio.timeout(10):
            await connected.wait()
        ended = await runtime.end(session.id)
        assert ended.status == "ended"
        assert not runtime.active
    finally:
        await runtime.close()
        await peer.close()
        await database.close()


@pytest.mark.parametrize("reason", list(ConversationEndReason))
async def test_completion_is_saved_and_sent_before_disconnect(tmp_path, monkeypatch, reason):
    database = await Database.open(tmp_path / "completion.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        session, _ = await sessions.create("oral-exam", "pl")
        connection = Mock(disconnect=AsyncMock())
        entry = ActiveSession(connection)
        entry.ready.set()
        runtime = VoiceRuntime(sessions, Settings(_env_file=None))
        runtime.active[session.id] = entry
        monkeypatch.setattr(
            "voicebot.infrastructure.voice.runtime.confirm_playback", AsyncMock(return_value=True)
        )

        async def run(stop, ready, transcript, completed):
            await transcript("assistant", "Dziękuję, egzamin zakończony.", False, "now")
            await completed(reason, b"closing audio")
            saved = await sessions.get(session.id)
            assert saved.status == "ended"
            assert saved.end_reason == reason
            connection.disconnect.assert_not_awaited()
            assert connection.send_app_message.call_args.args[0]["data"] == {
                "kind": "session.ended",
                "reason": reason,
            }
            # The UI's cleanup request must not replace the stored completion reason.
            cleaned = await sessions.transition(session.id, "ended", "user_ended")
            assert cleaned.end_reason == reason

        monkeypatch.setattr(
            "voicebot.infrastructure.voice.runtime.GeminiConversation",
            Mock(return_value=Mock(run=run)),
        )
        await runtime._run(session.id, entry)

        events = await sessions.events(session.id, 0, 100)
        assert [event.kind for event in events] == [
            "session.created",
            "transcript.final",
            "session.ended",
        ]
        messages = [
            call.args[0]["data"]["kind"] for call in connection.send_app_message.call_args_list
        ]
        assert messages == ["transcript.final", "session.ended"]
        connection.disconnect.assert_awaited_once()
        assert not runtime.active
    finally:
        await database.close()


async def test_completion_does_not_override_an_external_stop(tmp_path, monkeypatch):
    database = await Database.open(tmp_path / "stop.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        session, _ = await sessions.create("oral-exam", "pl")
        entry = ActiveSession(Mock(disconnect=AsyncMock()))
        entry.ready.set()
        runtime = VoiceRuntime(sessions, Settings(_env_file=None))

        async def run(stop, ready, transcript, completed):
            entry.reason = "session_timeout"
            stop.set()
            await completed(ConversationEndReason.SCENARIO_COMPLETED, b"closing audio")

        monkeypatch.setattr(
            "voicebot.infrastructure.voice.runtime.GeminiConversation",
            Mock(return_value=Mock(run=run)),
        )
        await runtime._run(session.id, entry)
        assert (await sessions.get(session.id)).end_reason == "session_timeout"
    finally:
        await database.close()


@pytest.mark.parametrize("played", [True, False])
async def test_real_pipeline_waits_for_client_playback_before_completion(
    tmp_path, monkeypatch, played
):
    database = await Database.open(tmp_path / "pipeline.sqlite3")
    sessions = Sessions(database, load_scenarios(), "test-model")
    runtime = VoiceRuntime(sessions, Settings(_env_file=None, google_api_key="test-key"))
    conversations = []
    audio_bytes_sent = 0
    audio_bytes_at_end = 0

    def conversation_factory(*args):
        conversation = GeminiConversation(*args)
        conversation.llm._connect = AsyncMock()
        conversation.llm._disconnect = AsyncMock()
        conversation.llm._handle_context = AsyncMock()
        output = conversation.transport.output()
        write_audio = output.write_audio_frame

        async def write(frame):
            nonlocal audio_bytes_sent
            result = await write_audio(frame)
            audio_bytes_sent += len(frame.audio)
            return result

        output.write_audio_frame = write
        conversations.append(conversation)
        return conversation

    monkeypatch.setattr(
        "voicebot.infrastructure.voice.runtime.GeminiConversation", conversation_factory
    )
    peer = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    ready = asyncio.Event()
    ended = asyncio.Event()
    clip_ready = asyncio.Event()
    messages = []
    audio_chunks = []
    playback_id = None
    channel = peer.createDataChannel("rtvi-ai")

    @channel.on("message")
    def receive(message):
        nonlocal audio_bytes_at_end, playback_id
        data = json.loads(message)
        if data.get("type") == "server-message":
            messages.append(data["data"])
            if data["data"]["kind"] == "session.ready":
                ready.set()
            if data["data"]["kind"] == "playback.start":
                playback_id = data["data"]["id"]
            if data["data"]["kind"] == "playback.audio":
                audio_chunks.append(base64.b64decode(data["data"]["audio"]))
            if data["data"]["kind"] == "playback.end":
                clip_ready.set()
            if data["data"]["kind"] in ("session.ended", "session.failed"):
                audio_bytes_at_end = audio_bytes_sent
                ended.set()

    try:
        peer.addTransceiver("audio", direction="sendrecv")
        await peer.setLocalDescription(await peer.createOffer())
        session, _ = await sessions.create("oral-exam", "en")
        answer = await runtime.offer(session.id, Offer(sdp=peer.localDescription.sdp, type="offer"))
        entry = runtime.active[session.id]
        await peer.setRemoteDescription(RTCSessionDescription(sdp=answer.sdp, type=answer.type))
        async with asyncio.timeout(10):
            await ready.wait()
            conversation = conversations[0]
            await conversation._finish_session(
                SimpleNamespace(
                    arguments={"reason": "scenario_completed"}, result_callback=AsyncMock()
                )
            )
            for frame in [
                LLMFullResponseStartFrame(),
                TTSStartedFrame(),
                TTSTextFrame("Goodbye.", text_type=TextType.SENTENCE),
                TTSAudioRawFrame(audio=b"\x01\x00" * 12000, sample_rate=24000, num_channels=1),
            ]:
                await conversation.llm.push_frame(frame)
            await conversation.llm.push_frame(TTSStoppedFrame())
            await conversation.llm.push_frame(LLMFullResponseEndFrame())
            await clip_ready.wait()
            assert not ended.is_set()
            assert (await sessions.get(session.id)).status == "active"
            assert not entry.task.done()
            assert entry.connection.is_connected()
            with wave.open(io.BytesIO(b"".join(audio_chunks)), "rb") as clip:
                assert clip.getnframes() == 12000
                assert clip.getframerate() == 24000
                assert clip.readframes(12000) == b"\x01\x00" * 12000
            channel.send(
                json.dumps(
                    {"type": "playback.finished", "data": {"id": playback_id, "played": played}}
                )
            )
            await ended.wait()
            await entry.task

        final = await sessions.get(session.id)
        assert final.end_reason == ("scenario_completed" if played else "playback_failed")
        session_messages = [
            message for message in messages if not message["kind"].startswith("playback.")
        ]
        assert [message["kind"] for message in session_messages] == [
            "session.ready",
            "transcript.final",
            "session.ended" if played else "session.failed",
        ]
        assert session_messages[1]["text"] == "Goodbye."
        assert audio_bytes_at_end == 0
        assert not runtime.active
    finally:
        await runtime.close()
        await peer.close()
        await database.close()
