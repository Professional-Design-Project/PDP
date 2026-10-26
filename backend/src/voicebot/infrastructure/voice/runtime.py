import asyncio
import logging
from dataclasses import dataclass, field

from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection

from voicebot.application.sessions import Sessions
from voicebot.domain.session import SessionConflict, SessionStatus
from voicebot.infrastructure.voice.webrtc import Answer, Candidates, Offer, add_candidates
from voicebot.settings import Settings

logger = logging.getLogger(__name__)


class InvalidSignaling(Exception):
    pass


@dataclass
class ActiveSession:
    connection: SmallWebRTCConnection
    stop: asyncio.Event = field(default_factory=asyncio.Event)
    task: asyncio.Task | None = None
    reason: str = "client_disconnected"


class VoiceRuntime:
    def __init__(self, sessions: Sessions, settings: Settings) -> None:
        self.sessions = sessions
        self.settings = settings
        self.active: dict[str, ActiveSession] = {}
        self.lock = asyncio.Lock()

    async def offer(self, session_id: str, offer: Offer) -> Answer:
        async with self.lock:
            session = await self.sessions.get(session_id)
            if session.finished:
                raise SessionConflict("Session has ended")
            entry = self.active.get(session_id)
            if entry:
                if offer.pc_id != entry.connection.pc_id or offer.restart_pc:
                    raise SessionConflict(
                        "Connection already exists; start a new session to restart"
                    )
                await entry.connection.renegotiate(offer.sdp, offer.type)
                return Answer.model_validate(entry.connection.get_answer())
            if offer.pc_id or session.status != SessionStatus.CREATED:
                raise SessionConflict("No matching connection")
            await self.sessions.transition(session_id, SessionStatus.CONNECTING)
            connection = SmallWebRTCConnection(
                ice_servers=[
                    IceServer(**server.model_dump()) for server in self.settings.ice_servers
                ]
            )
            entry = ActiveSession(connection)
            self.active[session_id] = entry

            @connection.event_handler("closed")
            @connection.event_handler("failed")
            @connection.event_handler("disconnected")
            async def disconnected(connection):
                entry.stop.set()

            try:
                await connection.initialize(offer.sdp, offer.type)
                answer = Answer.model_validate(connection.get_answer())
                entry.task = asyncio.create_task(self._run(session_id, entry), name=session_id)
                return answer
            except BaseException:
                self.active.pop(session_id, None)
                await connection.disconnect()
                await self.sessions.transition(session_id, SessionStatus.FAILED, "signaling_failed")
                raise

    async def candidates(self, session_id: str, body: Candidates) -> None:
        async with self.lock:
            entry = self.active.get(session_id)
            if entry is None or entry.connection.pc_id != body.pc_id:
                raise SessionConflict("No matching connection")
            try:
                await add_candidates(entry.connection, body.candidates)
            except (ValueError, AssertionError, IndexError) as error:
                raise InvalidSignaling from error

    async def _serve(self, session_id: str, entry: ActiveSession) -> None:
        @entry.connection.event_handler("connected")
        async def connected(connection):
            await self.sessions.transition(session_id, SessionStatus.ACTIVE)

        await entry.connection.connect()
        await entry.stop.wait()

    async def _run(self, session_id: str, entry: ActiveSession) -> None:
        status = SessionStatus.ENDED
        try:
            await self._serve(session_id, entry)
        except asyncio.CancelledError:
            entry.reason = "server_shutdown"
        except Exception:
            logger.error("Voice runtime failed: session=%s", session_id)
            status = SessionStatus.FAILED
            entry.reason = "runtime_failed"
        finally:
            try:
                await entry.connection.disconnect()
            finally:
                await self.sessions.transition(session_id, status, entry.reason)
                self.active.pop(session_id, None)

    async def end(self, session_id: str, reason: str = "user_ended"):
        async with self.lock:
            entry = self.active.get(session_id)
            if entry:
                entry.reason = reason
                entry.stop.set()
        if entry and entry.task:
            await entry.task
        return await self.sessions.transition(session_id, SessionStatus.ENDED, reason)

    async def close(self) -> None:
        await asyncio.gather(*(self.end(key, "server_shutdown") for key in list(self.active)))
