import asyncio
import base64
import io
import wave
from contextlib import suppress
from uuid import uuid4

from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection

PLAYBACK_GRACE_SECONDS = 10


class PlaybackFailed(Exception):
    pass


async def confirm_playback(
    connection: SmallWebRTCConnection, stop: asyncio.Event, audio: bytes
) -> bool:
    with wave.open(io.BytesIO(audio), "rb") as clip:
        duration = clip.getnframes() / clip.getframerate()
    playback_id = uuid4().hex
    acknowledged = asyncio.get_running_loop().create_future()

    async def received(connection, message):
        if not isinstance(message, dict) or message.get("type") != "playback.finished":
            return
        data = message.get("data")
        if (
            isinstance(data, dict)
            and data.get("id") == playback_id
            and type(data.get("played")) is bool
            and not acknowledged.done()
        ):
            acknowledged.set_result(data["played"])

    def send(data):
        connection.send_app_message({"label": "rtvi-ai", "type": "server-message", "data": data})

    connection.add_event_handler("app-message", received)
    stopped = asyncio.create_task(stop.wait())
    try:
        send({"kind": "playback.start", "id": playback_id, "bytes": len(audio)})
        for offset in range(0, len(audio), 12000):
            send(
                {
                    "kind": "playback.audio",
                    "id": playback_id,
                    "audio": base64.b64encode(audio[offset : offset + 12000]).decode("ascii"),
                }
            )
        send({"kind": "playback.end", "id": playback_id})
        await asyncio.wait(
            (acknowledged, stopped),
            timeout=duration + PLAYBACK_GRACE_SECONDS,
            return_when=asyncio.FIRST_COMPLETED,
        )
        if stop.is_set():
            return False
        if not acknowledged.done():
            raise TimeoutError("Closing playback was not confirmed")
        if not acknowledged.result():
            raise PlaybackFailed
        return True
    finally:
        connection.remove_event_handler("app-message", received)
        acknowledged.cancel()
        stopped.cancel()
        with suppress(asyncio.CancelledError):
            await stopped
