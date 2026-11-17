import json
from dataclasses import asdict
from datetime import datetime

import asyncpg

from voicebot.domain.session import Consent, Session, SessionEvent, SessionStatus

LEASE_KEY = 482_719_334

SESSION_COLUMNS = (
    "id, user_id, scenario_id, scenario_version, language, profile, model, status, created_at, "
    "started_at, ended_at, end_reason, context, instructions, token_hash, consent"
)


async def _json_codec(connection: asyncpg.Connection) -> None:
    await connection.set_type_codec(
        "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )


def _consent_to_json(consent: Consent | None) -> dict | None:
    if consent is None:
        return None
    data = asdict(consent)
    data["given_at"] = consent.given_at.isoformat()
    return data


def _consent_from_json(data: dict | None) -> Consent | None:
    if not data:
        return None
    return Consent(**{**data, "given_at": datetime.fromisoformat(data["given_at"])})


def _session_from_row(row: asyncpg.Record) -> Session:
    return Session(
        id=str(row["id"]),
        scenario_id=row["scenario_id"],
        scenario_version=row["scenario_version"],
        instructions=row["instructions"],
        language=row["language"],
        profile=row["profile"],
        model=row["model"],
        token_hash=row["token_hash"],
        created_at=row["created_at"],
        status=SessionStatus(row["status"]),
        started_at=row["started_at"],
        ended_at=row["ended_at"],
        end_reason=row["end_reason"],
        consent=_consent_from_json(row["consent"]),
        context=row["context"],
        owner_id=str(row["user_id"]) if row["user_id"] else None,
    )


def _event_from_row(row: asyncpg.Record) -> SessionEvent:
    return SessionEvent(
        row["sequence"], str(row["session_id"]), row["kind"], row["created_at"], row["data"]
    )


class PostgresDatabase:
    def __init__(self, pool: asyncpg.Pool, lease: asyncpg.Connection) -> None:
        self.pool = pool
        self.lease = lease

    @classmethod
    async def open(cls, dsn: str) -> "PostgresDatabase":
        lease = await asyncpg.connect(dsn, statement_cache_size=0)
        try:
            if not await lease.fetchval("select pg_try_advisory_lock($1)", LEASE_KEY):
                raise RuntimeError("Database is already in use; run exactly one backend process")
            pool = await asyncpg.create_pool(
                dsn, min_size=1, max_size=5, statement_cache_size=0, init=_json_codec
            )
        except BaseException:
            await lease.close()
            raise
        return cls(pool, lease)

    async def close(self) -> None:
        try:
            await self.pool.close()
        finally:
            await self.lease.close()

    async def add(self, session: Session) -> None:
        await self.pool.execute(
            f"insert into public.practice_sessions ({SESSION_COLUMNS}) "
            "values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
            session.id,
            session.owner_id,
            session.scenario_id,
            session.scenario_version,
            session.language,
            session.profile,
            session.model,
            session.status.value,
            session.created_at,
            session.started_at,
            session.ended_at,
            session.end_reason,
            session.context,
            session.instructions,
            session.token_hash,
            _consent_to_json(session.consent),
        )

    async def get(self, session_id: str) -> Session | None:
        row = await self.pool.fetchrow(
            f"select {SESSION_COLUMNS} from public.practice_sessions where id = $1", session_id
        )
        return _session_from_row(row) if row else None

    async def save(self, session: Session) -> None:
        await self.pool.execute(
            "update public.practice_sessions "
            "set status = $2, started_at = $3, ended_at = $4, end_reason = $5 where id = $1",
            session.id,
            session.status.value,
            session.started_at,
            session.ended_at,
            session.end_reason,
        )

    async def unfinished(self) -> list[Session]:
        rows = await self.pool.fetch(
            f"select {SESSION_COLUMNS} from public.practice_sessions "
            "where status not in ('ended', 'failed')"
        )
        return [_session_from_row(row) for row in rows]

    async def append_event(
        self, session_id: str, kind: str, data: dict[str, str | bool | int | None]
    ) -> SessionEvent:
        row = await self.pool.fetchrow(
            "insert into public.session_events (session_id, kind, data) values ($1, $2, $3) "
            "returning sequence, session_id, kind, created_at, data",
            session_id,
            kind,
            data,
        )
        return _event_from_row(row)

    async def events(
        self, session_id: str, after: int = 0, limit: int = 100, kind: str | None = None
    ) -> list[SessionEvent]:
        rows = await self.pool.fetch(
            "select sequence, session_id, kind, created_at, data from public.session_events "
            "where session_id = $1 and sequence > $2 and ($3::text is null or kind = $3) "
            "order by sequence limit $4",
            session_id,
            after,
            kind,
            limit,
        )
        return [_event_from_row(row) for row in rows]

    async def record_consent(self, user_id: str, consent: Consent) -> None:
        await self.pool.execute(
            "insert into public.consents "
            "(user_id, version, language, voice, transcripts, improvement, outside_eu, given_at) "
            "values ($1, $2, $3, $4, $5, $6, $7, $8)",
            user_id,
            consent.version,
            consent.language,
            consent.voice,
            consent.transcripts,
            consent.improvement,
            consent.outside_eu,
            consent.given_at,
        )
