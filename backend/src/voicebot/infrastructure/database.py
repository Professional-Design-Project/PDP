import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import aiosqlite
from pydantic import TypeAdapter

from voicebot.domain.session import Consent, Session, SessionEvent

# Initial schema is forward-only; subsequent changes get a new numbered migration.
MIGRATIONS = (
    """
    CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        payload TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        kind TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL
    );
    CREATE INDEX events_session_sequence ON events(session_id, sequence);
    """,
)


class Database:
    def __init__(self, connection: aiosqlite.Connection, lease: aiosqlite.Connection) -> None:
        self.connection = connection
        self.lease = lease
        self.adapter = TypeAdapter(Session)

    @classmethod
    async def open(cls, path: Path) -> "Database":
        path.parent.mkdir(parents=True, exist_ok=True)
        lease = await aiosqlite.connect(path.with_suffix(".lock"), timeout=0)
        try:
            await lease.execute("BEGIN EXCLUSIVE")
        except sqlite3.OperationalError as error:
            await lease.close()
            raise RuntimeError(
                "Database is already in use; run exactly one backend process"
            ) from error
        connection = None
        try:
            connection = await aiosqlite.connect(path)
            await connection.execute("PRAGMA journal_mode=WAL")
            await connection.execute("PRAGMA foreign_keys=ON")
            cursor = await connection.execute("PRAGMA user_version")
            version = (await cursor.fetchone())[0]
            if version > len(MIGRATIONS):
                raise RuntimeError("Database schema is newer than this application")
            for index in range(version, len(MIGRATIONS)):
                await connection.executescript(
                    f"BEGIN;\n{MIGRATIONS[index]}\nPRAGMA user_version={index + 1};\nCOMMIT;"
                )
            return cls(connection, lease)
        except BaseException:
            if connection:
                await connection.close()
            await lease.close()
            raise

    async def close(self) -> None:
        try:
            await self.connection.close()
        finally:
            await self.lease.close()

    async def add(self, session: Session) -> None:
        await self.connection.execute(
            "INSERT INTO sessions (id, status, payload) VALUES (?, ?, ?)",
            (session.id, session.status, self.adapter.dump_json(session).decode()),
        )
        await self.connection.commit()

    async def get(self, session_id: str) -> Session | None:
        async with self.connection.execute(
            "SELECT payload FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
        return self.adapter.validate_json(row[0]) if row else None

    async def save(self, session: Session) -> None:
        await self.connection.execute(
            "UPDATE sessions SET status = ?, payload = ? WHERE id = ?",
            (session.status, self.adapter.dump_json(session).decode(), session.id),
        )
        await self.connection.commit()

    async def unfinished(self) -> list[Session]:
        async with self.connection.execute(
            "SELECT payload FROM sessions WHERE status NOT IN ('ended', 'failed')"
        ) as cursor:
            return [self.adapter.validate_json(row[0]) for row in await cursor.fetchall()]

    async def append_event(
        self, session_id: str, kind: str, data: dict[str, str | bool | int | None]
    ) -> SessionEvent:
        now = datetime.now(UTC)
        cursor = await self.connection.execute(
            "INSERT INTO events (session_id, kind, timestamp, data) VALUES (?, ?, ?, ?)",
            (session_id, kind, now.isoformat(), json.dumps(data, ensure_ascii=False)),
        )
        await self.connection.commit()
        return SessionEvent(cursor.lastrowid, session_id, kind, now, data)

    async def record_consent(self, user_id: str, consent: Consent) -> None:
        return None

    async def events(
        self, session_id: str, after: int = 0, limit: int = 100, kind: str | None = None
    ) -> list[SessionEvent]:
        async with self.connection.execute(
            "SELECT sequence, session_id, kind, timestamp, data FROM events "
            "WHERE session_id = ? AND sequence > ? AND (? IS NULL OR kind = ?) "
            "ORDER BY sequence LIMIT ?",
            (session_id, after, kind, kind, limit),
        ) as cursor:
            return [
                SessionEvent(
                    row[0], row[1], row[2], datetime.fromisoformat(row[3]), json.loads(row[4])
                )
                for row in await cursor.fetchall()
            ]
