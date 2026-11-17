import asyncio
import logging
from contextlib import suppress
from dataclasses import dataclass, field

from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection

from voicebot.application.sessions import Sessions
from voicebot.domain.session import SessionConflict, SessionStatus, Speaker
from voicebot.infrastructure.voice.gemini import GeminiConversation, VoiceUnavailable
from voicebot.infrastructure.voice.webrtc import Answer, Candidates, Offer, add_candidates
from voicebot.settings import Settings

logger = logging.getLogger(__name__)


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


class VoiceRuntime:
    def __init__(self, sessions: Sessions, settings: Settings) -> None:
        self.sessions = sessions
        self.settings = settings
        self.active: dict[str, ActiveSession] = {}
        self.lock = asyncio.Lock()

    async def offer(self, session_id: str, offer: Offer) -> Answer:
        if not self.settings.google_api_key.get_secret_value():
            raise VoiceUnavailable
        async with self.lock:
            session = await self.sessions.for_conversation(session_id)
            if session.finished:
                raise SessionConflict("Session has ended")
            entry = self.active.get(session_id)
            if entry:
                if offer.pc_id != entry.connection.pc_id or offer.restart_pc:
                    raise SessionConflict(
                        "Connection already exists; start a new session to restart"
                    )
                fresh = False
            else:
                if offer.pc_id or session.status != SessionStatus.CREATED:
                    raise SessionConflict("No matching connection")
                connection = SmallWebRTCConnection(
                    ice_servers=[
                        IceServer(**server.model_dump()) for server in self.settings.ice_servers
                    ],
                    connection_timeout_secs=self.settings.connect_timeout_seconds,
                )
                connecting = await self.sessions.transition(session_id, SessionStatus.CONNECTING)
                if connecting.finished:
                    await connection.disconnect()
                    raise SessionConflict("Session has ended")
                entry = ActiveSession(connection)
                self.active[session_id] = entry
                fresh = True

                @connection.event_handler("closed")
                @connection.event_handler("disconnected")
                async def disconnected(connection):
                    entry.stop.set()

                @connection.event_handler("failed")
                async def failed(connection):
                    entry.failed = True
                    entry.reason = "transport_failed"
                    entry.stop.set()

        async with entry.signaling_lock:
            if entry.stop.is_set():
                if fresh:
                    await entry.connection.disconnect()
                    self.active.pop(session_id, None)
                    await self.sessions.transition(
                        session_id,
                        SessionStatus.FAILED if entry.failed else SessionStatus.ENDED,
                        entry.reason,
                    )
                raise SessionConflict("Connection is closing")
            try:
                async with asyncio.timeout(self.settings.connect_timeout_seconds):
                    if fresh:
                        await entry.connection.initialize(offer.sdp, offer.type)
                    else:
                        await entry.connection.renegotiate(offer.sdp, offer.type)
                answer = Answer.model_validate(entry.connection.get_answer())
                if fresh:
                    entry.task = asyncio.create_task(self._run(session_id, entry), name=session_id)
                return answer
            except BaseException:
                entry.failed = True
                entry.reason = "signaling_failed"
                entry.stop.set()
                if fresh:
                    self.active.pop(session_id, None)
                    try:
                        async with asyncio.timeout(self.settings.cleanup_timeout_seconds):
                            await entry.connection.disconnect()
                    finally:
                        await self.sessions.transition(
                            session_id, SessionStatus.FAILED, "signaling_failed"
                        )
                raise

    async def candidates(self, session_id: str, body: Candidates) -> None:
        entry = self.active.get(session_id)
        if entry is None or entry.connection.pc_id != body.pc_id:
            raise SessionConflict("No matching connection")
        async with entry.signaling_lock:
            if entry.stop.is_set():
                raise SessionConflict("Connection is closing")
            try:
                await add_candidates(entry.connection, body.candidates)
            except (ValueError, AssertionError, IndexError) as error:
                raise InvalidSignaling from error

    async def _serve(self, session_id: str, entry: ActiveSession) -> None:
        if entry.stop.is_set():
            return
        session = await self.sessions.get(session_id)
        conversation = GeminiConversation(session, entry.connection, self.settings)

        async def ready():
            if entry.stop.is_set():
                return
            active = await self.sessions.transition(session_id, SessionStatus.ACTIVE)
            if active.finished:
                entry.stop.set()
                return
            entry.ready.set()
            entry.connection.send_app_message(
                {"label": "rtvi-ai", "type": "server-message", "data": {"kind": "session.ready"}}
            )

        async def transcript(role: Speaker, text: str, interrupted: bool, started_at: str):
            try:
                event = await self.sessions.transcript(
                    session_id, role, text, interrupted, started_at
                )
            except Exception:
                logger.error("Transcript save failed: session=%s", session_id)
                entry.reason = "storage_failed"
                entry.failed = True
                entry.stop.set()
                return
            if event:
                entry.connection.send_app_message(
                    {
                        "label": "rtvi-ai",
                        "type": "server-message",
                        "data": {
                            "kind": event.kind,
                            "sequence": event.sequence,
                            "timestamp": event.timestamp.isoformat(),
                            **event.data,
                        },
                    }
                )

        await conversation.run(entry.stop, ready, transcript)

    async def _watch(self, entry: ActiveSession) -> None:
        try:
            async with asyncio.timeout(self.settings.connect_timeout_seconds):
                await entry.ready.wait()
            async with asyncio.timeout(self.settings.session_timeout_seconds):
                await entry.stop.wait()
        except TimeoutError:
            entry.reason = "session_timeout" if entry.ready.is_set() else "connection_timeout"
            entry.failed = not entry.ready.is_set()
            entry.stop.set()

    async def _run(self, session_id: str, entry: ActiveSession) -> None:
        status = SessionStatus.ENDED
        watchdog = asyncio.create_task(self._watch(entry))
        try:
            await self._serve(session_id, entry)
        except asyncio.CancelledError:
            entry.reason = "server_shutdown"
        except Exception:
            logger.error("Voice runtime failed: session=%s", session_id)
            status = SessionStatus.FAILED
            entry.reason = "runtime_failed"
        finally:
            watchdog.cancel()
            with suppress(asyncio.CancelledError):
                await watchdog
            if entry.failed:
                status = SessionStatus.FAILED
            try:
                entry.connection.send_app_message(
                    {
                        "label": "rtvi-ai",
                        "type": "server-message",
                        "data": {"kind": f"session.{status}", "reason": entry.reason},
                    }
                )
                try:
                    async with asyncio.timeout(self.settings.cleanup_timeout_seconds):
                        await entry.connection.disconnect()
                except Exception:
                    logger.error("Connection cleanup failed: session=%s", session_id)
                    status = SessionStatus.FAILED
                    entry.reason = "cleanup_failed"
            finally:
                try:
                    await self.sessions.transition(session_id, status, entry.reason)
                    logger.info("Session finished: session=%s reason=%s", session_id, entry.reason)
                except Exception:
                    logger.error("Session finalization failed: session=%s", session_id)
                finally:
                    self.active.pop(session_id, None)

    async def end(self, session_id: str, reason: str = "user_ended"):
        async with self.lock:
            entry = self.active.get(session_id)
            if entry:
                entry.reason = reason
                entry.stop.set()
        if entry:
            async with entry.signaling_lock:
                pass
        if entry and entry.task:
            done, _ = await asyncio.wait(
                {entry.task}, timeout=self.settings.cleanup_timeout_seconds
            )
            if not done:
                entry.task.cancel()
            with suppress(asyncio.CancelledError, TimeoutError):
                async with asyncio.timeout(self.settings.cleanup_timeout_seconds):
                    await asyncio.shield(entry.task)
        return await self.sessions.transition(session_id, SessionStatus.ENDED, reason)

    async def close(self) -> None:
        await asyncio.gather(*(self.end(key, "server_shutdown") for key in list(self.active)))

    async def maintain(self) -> None:
        while True:
            try:
                await self.sessions.expire_pending(self.settings.pending_timeout_seconds)
            except Exception:
                logger.error("Session expiry failed")
            await asyncio.sleep(min(5, self.settings.pending_timeout_seconds))
