import asyncio
import io
import wave

import pytest

from voicebot.infrastructure.voice.playback import confirm_playback


class Connection:
    def __init__(self):
        self.handlers = []
        self.messages = []
        self.sent = asyncio.Event()

    def add_event_handler(self, name, handler):
        self.handlers.append(handler)

    def remove_event_handler(self, name, handler):
        self.handlers.remove(handler)

    def send_app_message(self, message):
        self.messages.append(message["data"])
        self.sent.set()

    async def acknowledge(self, playback_id, played):
        for handler in self.handlers.copy():
            await handler(
                self, {"type": "playback.finished", "data": {"id": playback_id, "played": played}}
            )


@pytest.fixture
def clip():
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(b"\x00\x00" * 240)
    return buffer.getvalue()


async def test_stale_and_malformed_acknowledgements_cannot_finish_playback(clip):
    connection = Connection()
    task = asyncio.create_task(confirm_playback(connection, asyncio.Event(), clip))
    await connection.sent.wait()
    playback_id = connection.messages[0]["id"]
    await connection.acknowledge("old-playback", True)
    await connection.acknowledge(playback_id, "true")
    assert not task.done()
    await connection.acknowledge(playback_id, True)
    assert await task is True
    await connection.acknowledge(playback_id, True)
    assert not connection.handlers


async def test_missing_acknowledgement_times_out_and_removes_listener(clip, monkeypatch):
    monkeypatch.setattr("voicebot.infrastructure.voice.playback.PLAYBACK_GRACE_SECONDS", 0)
    connection = Connection()
    with pytest.raises(TimeoutError):
        await confirm_playback(connection, asyncio.Event(), clip)
    assert not connection.handlers


async def test_leaving_interrupts_the_playback_wait(clip):
    connection = Connection()
    stop = asyncio.Event()
    task = asyncio.create_task(confirm_playback(connection, stop, clip))
    await connection.sent.wait()
    stop.set()
    assert await task is False
    assert not connection.handlers
