import asyncio
from dataclasses import dataclass, field

from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection

from voicebot.settings import Settings


class InvalidSignaling(Exception):
    pass


@dataclass
class ActiveSession:
    connection: SmallWebRTCConnection
    signaling_lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    stop: asyncio.Event = field(default_factory=asyncio.Event)
    ready: asyncio.Event = field(default_factory=asyncio.Event)
    task: asyncio.Task | None = None
    reason: str = "client_disconnected"
    failed: bool = False

    @classmethod
    def open(cls, settings: Settings) -> "ActiveSession":
        connection = SmallWebRTCConnection(
            ice_servers=[IceServer(**server.model_dump()) for server in settings.ice_servers],
            connection_timeout_secs=settings.connect_timeout_seconds,
        )
        entry = cls(connection)

        @connection.event_handler("closed")
        @connection.event_handler("disconnected")
        async def disconnected(connection):
            entry.stop.set()

        @connection.event_handler("failed")
        async def failed(connection):
            entry.fail("transport_failed")

        return entry

    def fail(self, reason: str) -> None:
        self.failed = True
        self.reason = reason
        self.stop.set()

    def send(self, data: dict) -> None:
        self.connection.send_app_message(
            {"label": "rtvi-ai", "type": "server-message", "data": data}
        )

    async def watch(self, connect_timeout: float, session_timeout: float) -> None:
        try:
            async with asyncio.timeout(connect_timeout):
                await self.ready.wait()
            async with asyncio.timeout(session_timeout):
                await self.stop.wait()
        except TimeoutError:
            self.reason = "session_timeout" if self.ready.is_set() else "connection_timeout"
            self.failed = not self.ready.is_set()
            self.stop.set()
