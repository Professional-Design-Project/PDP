from pathlib import Path

import aiosqlite
from pydantic import TypeAdapter

from voicebot.domain.session import Session

# Initial schema is forward-only; subsequent changes get a new numbered migration.
MIGRATIONS = (
    """
    CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        payload TEXT NOT NULL
    );
    """,
)


class Database:
    def __init__(self, connection: aiosqlite.Connection) -> None:
        self.connection = connection
        self.adapter = TypeAdapter(Session)

    @classmethod
    async def open(cls, path: Path) -> "Database":
        path.parent.mkdir(parents=True, exist_ok=True)
        connection = await aiosqlite.connect(path)
        try:
            await connection.execute("PRAGMA journal_mode=WAL")
            cursor = await connection.execute("PRAGMA user_version")
            version = (await cursor.fetchone())[0]
            if version > len(MIGRATIONS):
                raise RuntimeError("Database schema is newer than this application")
            for index in range(version, len(MIGRATIONS)):
                await connection.executescript(
                    f"BEGIN;\n{MIGRATIONS[index]}\nPRAGMA user_version={index + 1};\nCOMMIT;"
                )
            return cls(connection)
        except BaseException:
            await connection.close()
            raise

    async def close(self) -> None:
        await self.connection.close()

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
