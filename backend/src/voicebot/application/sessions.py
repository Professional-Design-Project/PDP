import asyncio
import hashlib
import secrets
from datetime import UTC, datetime
from uuid import uuid4

from voicebot.application.ports import SessionRepository
from voicebot.application.scenarios import Scenarios, compile_instructions
from voicebot.domain.session import Session, SessionStatus


class SessionNotFound(Exception):
    pass


class SessionAccessDenied(Exception):
    pass


class Sessions:
    def __init__(self, repository: SessionRepository, scenarios: Scenarios, model: str) -> None:
        self.repository = repository
        self.scenarios = scenarios
        self.model = model
        self.lock = asyncio.Lock()

    async def create(self, scenario_id: str) -> tuple[Session, str]:
        scenario = self.scenarios.get(scenario_id)
        token = secrets.token_urlsafe(32)
        session = Session(
            id=str(uuid4()),
            scenario_id=scenario.id,
            scenario_version=scenario.version,
            instructions=compile_instructions(scenario),
            language=scenario.language,
            profile="gemini_live",
            model=self.model,
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            created_at=datetime.now(UTC),
        )
        await self.repository.add(session)
        return session, token

    async def get(self, session_id: str) -> Session:
        session = await self.repository.get(session_id)
        if session is None:
            raise SessionNotFound(session_id)
        return session

    async def authorize(self, session_id: str, token: str) -> Session:
        session = await self.get(session_id)
        digest = hashlib.sha256(token.encode()).hexdigest()
        if not secrets.compare_digest(digest, session.token_hash):
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
            return session

    async def recover(self) -> None:
        for session in await self.repository.unfinished():
            await self.transition(session.id, SessionStatus.FAILED, "server_restarted")
