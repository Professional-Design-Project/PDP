import os
from datetime import UTC, datetime
from pathlib import Path

import asyncpg
import pytest

from voicebot.application.sessions import Sessions
from voicebot.domain.scenario import Language
from voicebot.domain.session import Consent, SessionStatus
from voicebot.infrastructure.postgres import PostgresDatabase
from voicebot.infrastructure.recording_retention import RecordingRetention
from voicebot.infrastructure.scenarios import load_scenarios

ADMIN_URL = os.environ.get("VOICEBOT_TEST_DATABASE_URL", "")
ROOT = Path(__file__).parents[2]
USER = "3f1c2b8e-5d4a-4f6b-9c7d-1a2b3c4d5e6f"

pytestmark = pytest.mark.skipif(
    not ADMIN_URL, reason="Set VOICEBOT_TEST_DATABASE_URL to a disposable Postgres server"
)


@pytest.fixture
async def dsn():
    admin = await asyncpg.connect(ADMIN_URL)
    await admin.execute("drop database if exists ensaio_test with (force)")
    await admin.execute("create database ensaio_test")
    await admin.close()
    url = ADMIN_URL.rsplit("/", 1)[0] + "/ensaio_test"
    connection = await asyncpg.connect(url)
    await connection.execute((ROOT / "backend/tests/supabase_stub.sql").read_text("utf-8"))
    migrations = sorted((ROOT / "supabase/migrations").glob("*.sql"))
    for migration in migrations:
        await connection.execute(migration.read_text("utf-8"))
    await connection.execute("insert into auth.users (id) values ($1)", USER)
    await connection.close()
    return url


async def test_sessions_events_and_consents_are_stored_in_postgres(dsn):
    database = await PostgresDatabase.open(dsn)
    try:
        with pytest.raises(RuntimeError, match="one backend process"):
            await PostgresDatabase.open(dsn)
        sessions = Sessions(database, load_scenarios(), "test-model")
        consent = Consent("v1", "en", True, True, False, True, datetime.now(UTC))
        session, _ = await sessions.create(
            "oral-exam", Language.EN, "Operating systems", consent, owner_id=USER
        )
        stored = await database.get(session.id)
        assert stored.owner_id == USER
        assert stored.consent == consent
        assert stored.context == "Operating systems"
        assert [item.id for item in await database.unfinished()] == [session.id]

        await sessions.transition(session.id, SessionStatus.CONNECTING)
        active = await sessions.transition(session.id, SessionStatus.ACTIVE)
        assert active.started_at is not None
        await sessions.transcript(session.id, "user", "A process is a running program.", False, "")
        await sessions.transition(session.id, SessionStatus.ENDED, "user_ended")

        lines = await database.events(session.id, kind="transcript.final")
        assert lines[0].data["text"] == "A process is a running program."
        kinds = [event.kind for event in await database.events(session.id)]
        assert kinds[:2] == ["session.created", "consent.recorded"]
        assert (await database.get(session.id)).status == SessionStatus.ENDED
        assert await database.unfinished() == []
    finally:
        await database.close()

    connection = await asyncpg.connect(dsn)
    row = await connection.fetchrow("select * from public.consents where user_id = $1", USER)
    await connection.close()
    assert row["version"] == "v1"
    assert row["outside_eu"] is True
    assert row["improvement"] is False


OTHER = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"


async def _insert_session(connection, owner, status):
    return await connection.fetchval(
        """
        insert into public.practice_sessions
          (id, user_id, scenario_id, scenario_version, language, profile, model, status,
           created_at, instructions, token_hash)
        values (gen_random_uuid(), $1, 'oral-exam', 1, 'en', 'p', 'm', $2, now(), 'i', 'h')
        returning id
        """,
        owner,
        status,
    )


async def _delete_as(connection, user, session_id):
    async with connection.transaction():
        await connection.execute("set local role authenticated")
        await connection.execute("select set_config('request.jwt.claim.sub', $1, true)", user)
        return await connection.fetch(
            "delete from public.practice_sessions where id = $1 returning id", session_id
        )


async def test_owners_can_delete_only_their_finished_sessions(dsn):
    connection = await asyncpg.connect(dsn)
    try:
        await connection.execute("insert into auth.users (id) values ($1)", OTHER)
        finished = await _insert_session(connection, USER, "ended")
        live = await _insert_session(connection, USER, "active")
        await connection.execute(
            "insert into public.session_events (session_id, kind) values ($1, 'transcript.final')",
            finished,
        )

        assert await _delete_as(connection, OTHER, finished) == []
        assert await _delete_as(connection, USER, live) == []
        assert len(await _delete_as(connection, USER, finished)) == 1

        remaining = await connection.fetchval(
            "select count(*) from public.session_events where session_id = $1", finished
        )
        assert remaining == 0
        assert (
            await connection.fetchval(
                "select count(*) from public.practice_sessions where id = $1", live
            )
            == 1
        )
    finally:
        await connection.close()


async def test_owners_can_read_their_context_but_not_the_instructions(dsn):
    connection = await asyncpg.connect(dsn)
    try:
        session_id = await _insert_session(connection, USER, "ended")
        async with connection.transaction():
            await connection.execute("set local role authenticated")
            await connection.execute("select set_config('request.jwt.claim.sub', $1, true)", USER)
            context = await connection.fetchval(
                "select context from public.practice_sessions where id = $1", session_id
            )
            assert context == ""
        with pytest.raises(asyncpg.InsufficientPrivilegeError):
            async with connection.transaction():
                await connection.execute("set local role authenticated")
                await connection.fetch("select instructions from public.practice_sessions")
    finally:
        await connection.close()


async def _as_user(connection, user, query, *args):
    async with connection.transaction():
        await connection.execute("set local role authenticated")
        await connection.execute("select set_config('request.jwt.claim.sub', $1, true)", user)
        return await connection.fetch(query, *args)


async def test_recordings_are_saved_read_and_deleted_only_by_the_session_owner(dsn):
    insert = "insert into storage.objects (bucket_id, name) values ($1, $2) returning name"
    connection = await asyncpg.connect(dsn)
    try:
        await connection.execute("insert into auth.users (id) values ($1)", OTHER)
        finished = str(await _insert_session(connection, USER, "ended"))
        live = str(await _insert_session(connection, USER, "active"))
        bucket = await connection.fetchrow(
            "select public, allowed_mime_types from storage.buckets where id = 'recordings'"
        )
        assert bucket["public"] is False
        assert "audio/webm" in bucket["allowed_mime_types"]

        for user, bucket_id, name in [
            (USER, "recordings", f"{USER}/{live}"),
            (USER, "recordings", f"{OTHER}/{finished}"),
            (OTHER, "recordings", f"{OTHER}/{finished}"),
            (USER, "recordings", f"{USER}/{finished}/extra"),
        ]:
            with pytest.raises(asyncpg.InsufficientPrivilegeError):
                await _as_user(connection, user, insert, bucket_id, name)

        saved = await _as_user(connection, USER, insert, "recordings", f"{USER}/{finished}")
        assert len(saved) == 1

        select = "select name from storage.objects where bucket_id = 'recordings'"
        assert await _as_user(connection, OTHER, select) == []
        assert len(await _as_user(connection, USER, select)) == 1

        delete = "delete from storage.objects where bucket_id = 'recordings' returning name"
        assert await _as_user(connection, OTHER, delete) == []
        assert len(await _as_user(connection, USER, delete)) == 1
    finally:
        await connection.close()


async def test_recordings_expire_after_thirty_days(dsn):
    connection = await asyncpg.connect(dsn)
    try:
        finished = str(await _insert_session(connection, USER, "ended"))
        recent = str(await _insert_session(connection, USER, "ended"))
        await connection.execute(
            """
            insert into storage.objects (bucket_id, name, created_at) values
              ('recordings', $1, now() - interval '31 days'),
              ('recordings', $2, now() - interval '29 days')
            """,
            f"{USER}/{finished}",
            f"{USER}/{recent}",
        )
        visible = await _as_user(
            connection, USER, "select name from storage.objects where bucket_id = 'recordings'"
        )
        assert [row["name"] for row in visible] == [f"{USER}/{recent}"]

        class Remover:
            async def remove_recordings(self, paths):
                await connection.execute(
                    "delete from storage.objects where name = any($1::text[])", paths
                )

        pool = await asyncpg.create_pool(dsn, min_size=1, max_size=1)
        try:
            assert await RecordingRetention(pool, Remover(), 30).purge() == 1
        finally:
            await pool.close()
        remaining = await connection.fetch("select name from storage.objects")
        assert [row["name"] for row in remaining] == [f"{USER}/{recent}"]
    finally:
        await connection.close()
