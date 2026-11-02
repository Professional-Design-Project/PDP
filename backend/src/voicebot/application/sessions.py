import asyncio
import hashlib
import secrets
from datetime import UTC, datetime
from uuid import uuid4

from voicebot.application.ports import SessionRepository
from voicebot.application.scenarios import Scenarios, compile_instructions
from voicebot.domain.scenario import Language
from voicebot.domain.session import Session, SessionEvent, SessionStatus, Speaker


class SessionNotFound(Exception):
    pass


class SessionAccessDenied(Exception):
    pass


class SessionLimitExceeded(Exception):
    pass


class Sessions:
    def __init__(
        self,
        repository: SessionRepository,
        scenarios: Scenarios,
        model: str,
        max_sessions: int = 8,
        token_ttl_seconds: int = 86400,
    ) -> None:
        self.repository = repository
        self.scenarios = scenarios
        self.model = model
        self.lock = asyncio.Lock()
        self.max_sessions = max_sessions
        self.token_ttl_seconds = token_ttl_seconds

    async def create(
        self, scenario_id: str, language: Language, context: str = ""
    ) -> tuple[Session, str]:
        scenario = self.scenarios.get(scenario_id, language)
        token = secrets.token_urlsafe(32)
        session = Session(
            id=str(uuid4()),
            scenario_id=scenario.id,
            scenario_version=scenario.version,
            instructions=compile_instructions(scenario, context),
            language=scenario.language.value,
            profile="gemini_live",
            model=self.model,
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            created_at=datetime.now(UTC),
        )
        async with self.lock:
            if len(await self.repository.unfinished()) >= self.max_sessions:
                raise SessionLimitExceeded
            await self.repository.add(session)
            await self.repository.append_event(session.id, "session.created", {})
        return session, token

    async def get(self, session_id: str) -> Session:
        session = await self.repository.get(session_id)
        if session is None:
            raise SessionNotFound(session_id)
        return session

    async def authorize(self, session_id: str, token: str) -> Session:
        session = await self.get(session_id)
        digest = hashlib.sha256(token.encode()).hexdigest()
        expired = (datetime.now(UTC) - session.created_at).total_seconds() > self.token_ttl_seconds
        if not secrets.compare_digest(digest, session.token_hash) or expired:
            raise SessionAccessDenied
        return session

    async def transition(
        self, session_id: str, status: SessionStatus, reason: str | None = None
    ) -> Session:
        async with self.lock:
            session = await self.get(session_id)
            if session.finished:
                return session
            session = session.transition(status, datetime.now(UTC), reason)
            await self.repository.save(session)
            await self.repository.append_event(session.id, f"session.{status}", {"reason": reason})
            return session

    async def transcript(
        self,
        session_id: str,
        role: Speaker,
        text: str,
        interrupted: bool,
        started_at: str,
    ) -> SessionEvent | None:
        if not text.strip():
            return None
        return await self.repository.append_event(
            session_id,
            "transcript.final",
            {
                "role": role,
                "text": text,
                "interrupted": interrupted,
                "started_at": started_at,
                "playback_verified": False,
            },
        )

    async def recover(self) -> None:
        for session in await self.repository.unfinished():
            await self.transition(session.id, SessionStatus.FAILED, "server_restarted")

    async def expire_pending(self, timeout_seconds: int) -> None:
        async with self.lock:
            now = datetime.now(UTC)
            for session in await self.repository.unfinished():
                if (
                    session.status == SessionStatus.CREATED
                    and (now - session.created_at).total_seconds() >= timeout_seconds
                ):
                    ended = session.transition(SessionStatus.ENDED, now, "connection_timeout")
                    await self.repository.save(ended)
                    await self.repository.append_event(
                        session.id, "session.ended", {"reason": "connection_timeout"}
                    )

    async def events(
        self, session_id: str, after: int, limit: int, kind: str | None = None
    ) -> list[SessionEvent]:
        return await self.repository.events(session_id, after, limit, kind)
