from dataclasses import dataclass, replace
from datetime import datetime
from enum import StrEnum


class SessionStatus(StrEnum):
    CREATED = "created"
    CONNECTING = "connecting"
    ACTIVE = "active"
    ENDED = "ended"
    FAILED = "failed"


class SessionConflict(Exception):
    pass


@dataclass(frozen=True)
class Session:
    id: str
    scenario_id: str
    scenario_version: int
    instructions: str
    language: str
    profile: str
    model: str
    token_hash: str
    created_at: datetime
    status: SessionStatus = SessionStatus.CREATED
    started_at: datetime | None = None
    ended_at: datetime | None = None
    end_reason: str | None = None

    @property
    def finished(self) -> bool:
        return self.status in (SessionStatus.ENDED, SessionStatus.FAILED)

    def transition(self, status: SessionStatus, now: datetime, reason: str | None = None):
        allowed = {
            SessionStatus.CREATED: {
                SessionStatus.CONNECTING,
                SessionStatus.ENDED,
                SessionStatus.FAILED,
            },
            SessionStatus.CONNECTING: {
                SessionStatus.ACTIVE,
                SessionStatus.ENDED,
                SessionStatus.FAILED,
            },
            SessionStatus.ACTIVE: {SessionStatus.ENDED, SessionStatus.FAILED},
        }
        if status not in allowed.get(self.status, set()):
            raise SessionConflict(f"Cannot change session from {self.status} to {status}")
        terminal = status in (SessionStatus.ENDED, SessionStatus.FAILED)
        return replace(
            self,
            status=status,
            started_at=now if status == SessionStatus.ACTIVE else self.started_at,
            ended_at=now if terminal else None,
            end_reason=reason if terminal else None,
        )
