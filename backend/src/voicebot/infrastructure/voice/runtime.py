import asyncio
import logging
from collections.abc import Awaitable, Callable
from contextlib import suppress
from typing import Protocol

from voicebot.application.sessions import Sessions
from voicebot.domain.session import (
    ConversationEndReason,
    SessionConflict,
    SessionStatus,
    Speaker,
)
from voicebot.infrastructure.voice.active_session import ActiveSession, InvalidSignaling
from voicebot.infrastructure.voice.gemini import GeminiConversation, VoiceUnavailable
from voicebot.infrastructure.voice.playback import PlaybackFailed, confirm_playback
from voicebot.infrastructure.voice.webrtc import Answer, Candidates, Offer, add_candidates
from voicebot.settings import Settings

logger = logging.getLogger(__name__)


class Conversation(Protocol):
    async def run(
        self,
        stop: asyncio.Event,
        on_ready: Callable[[], Awaitable[None]],
        on_transcript: Callable[[Speaker, str, bool, str], Awaitable[None]],
        on_completed: Callable[[ConversationEndReason, bytes], Awaitable[None]],
    ) -> None: ...


class VoiceRuntime:
    def __init__(
        self,
        sessions: Sessions,
        settings: Settings,
        conversation_factory: Callable[..., Conversation] | None = None,
    ) -> None:
        self.sessions = sessions
        self.settings = settings
        self.conversation_factory = conversation_factory
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
                entry = ActiveSession.open(self.settings)
                connecting = await self.sessions.transition(session_id, SessionStatus.CONNECTING)
                if connecting.finished:
                    await entry.connection.disconnect()
                    raise SessionConflict("Session has ended")
                self.active[session_id] = entry
                fresh = True

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
                logger.info(
                    "WebRTC answer created: session=%s pc=%s",
                    session_id,
                    entry.connection.pc_id,
                )
                if fresh:
                    entry.task = asyncio.create_task(self._run(session_id, entry), name=session_id)
                return answer
            except BaseException:
                entry.fail("signaling_failed")
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
        session = await self.sessions.for_conversation(session_id)
        factory = self.conversation_factory or GeminiConversation
        conversation = factory(session, entry.connection, self.settings)

        async def ready():
            if entry.stop.is_set():
                return
            active = await self.sessions.transition(session_id, SessionStatus.ACTIVE)
            if active.finished:
                entry.stop.set()
                return
            entry.ready.set()
            logger.info("Voice session ready: session=%s", session_id)
            entry.send({"kind": "session.ready"})

        async def transcript(role: Speaker, text: str, interrupted: bool, started_at: str):
            try:
                event = await self.sessions.transcript(
                    session_id, role, text, interrupted, started_at
                )
            except Exception:
                logger.error("Transcript save failed: session=%s", session_id)
                entry.fail("storage_failed")
                return
            if event:
                entry.send(
                    {
                        "kind": event.kind,
                        "sequence": event.sequence,
                        "timestamp": event.timestamp.isoformat(),
                        **event.data,
                    }
                )

        async def completed(reason: ConversationEndReason, closing_audio: bytes):
            if entry.stop.is_set():
                return
            failure = None
            played = False
            try:
                played = await confirm_playback(entry.connection, entry.stop, closing_audio)
            except TimeoutError:
                failure = "playback_timeout"
            except PlaybackFailed:
                failure = "playback_failed"
            if entry.stop.is_set() or (not played and failure is None):
                return
            status = SessionStatus.FAILED if failure else SessionStatus.ENDED
            ended = await self.sessions.transition(session_id, status, failure or reason)
            entry.reason = ended.end_reason
            entry.send({"kind": f"session.{ended.status}", "reason": ended.end_reason})
            if failure:
                entry.fail(failure)

        await conversation.run(entry.stop, ready, transcript, completed)

    async def _run(self, session_id: str, entry: ActiveSession) -> None:
        status = SessionStatus.ENDED
        watchdog = asyncio.create_task(
            entry.watch(
                self.settings.connect_timeout_seconds, self.settings.session_timeout_seconds
            )
        )
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
                session = await self.sessions.get(session_id)
                if not session.finished:
                    ended = await self.sessions.transition(session_id, status, entry.reason)
                    entry.send({"kind": f"session.{ended.status}", "reason": ended.end_reason})
                logger.info("Session finished: session=%s reason=%s", session_id, entry.reason)
            except Exception:
                logger.error("Session finalization failed: session=%s", session_id)
            finally:
                try:
                    async with asyncio.timeout(self.settings.cleanup_timeout_seconds):
                        await entry.connection.disconnect()
                except Exception:
                    logger.error("Connection cleanup failed: session=%s", session_id)
                finally:
                    self.active.pop(session_id, None)

    async def end(self, session_id: str, reason: str = "user_ended"):
        async with self.lock:
            entry = self.active.get(session_id)
            if entry:
                if not entry.stop.is_set():
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
