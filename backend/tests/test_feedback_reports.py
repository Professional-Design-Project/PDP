import json
import os
from pathlib import Path

import asyncpg
import pytest

ADMIN_URL = os.environ.get("VOICEBOT_TEST_DATABASE_URL", "")
ROOT = Path(__file__).parents[2]
AUTHOR = "1b2c3d4e-5f60-4718-8293-a4b5c6d7e8f9"
STRANGER = "2c3d4e5f-6071-4829-93a4-b5c6d7e8f9a0"
ADMIN = "3d4e5f60-7182-4930-a4b5-c6d7e8f9a0b1"

pytestmark = pytest.mark.skipif(
    not ADMIN_URL, reason="Set VOICEBOT_TEST_DATABASE_URL to a disposable Postgres server"
)


@pytest.fixture
async def connection():
    admin = await asyncpg.connect(ADMIN_URL)
    await admin.execute("drop database if exists ensaio_reports_test with (force)")
    await admin.execute("create database ensaio_reports_test")
    await admin.close()
    url = ADMIN_URL.rsplit("/", 1)[0] + "/ensaio_reports_test"
    connection = await asyncpg.connect(url)
    await connection.execute((ROOT / "backend/tests/supabase_stub.sql").read_text("utf-8"))
    for migration in sorted((ROOT / "supabase/migrations").glob("*.sql")):
        await connection.execute(migration.read_text("utf-8"))
    for user in (AUTHOR, STRANGER, ADMIN):
        await connection.execute("insert into auth.users (id) values ($1)", user)
    await connection.execute("insert into private.admins (user_id) values ($1)", ADMIN)
    yield connection
    await connection.close()


async def _as(connection, user, query, *args):
    claims = json.dumps({"sub": user, "email": f"{user[:4]}@example.com"})
    async with connection.transaction():
        await connection.execute("set local role authenticated")
        await connection.execute("select set_config('request.jwt.claim.sub', $1, true)", user)
        await connection.execute("select set_config('request.jwt.claims', $1, true)", claims)
        return await connection.fetch(query, *args)


async def _send(connection, user, message="The mic button does nothing"):
    rows = await _as(
        connection,
        user,
        "insert into public.feedback_reports (kind, message) values ('bug', $1) returning *",
        message,
    )
    return rows[0]


async def test_reports_store_the_author_and_their_email(connection):
    report = await _send(connection, AUTHOR)
    assert str(report["user_id"]) == AUTHOR
    assert report["email"] == "1b2c@example.com"
    assert report["status"] == "new"


async def test_only_the_author_and_admins_can_read_a_report(connection):
    report = await _send(connection, AUTHOR)
    select = "select id from public.feedback_reports"
    assert [row["id"] for row in await _as(connection, AUTHOR, select)] == [report["id"]]
    assert await _as(connection, STRANGER, select) == []
    assert [row["id"] for row in await _as(connection, ADMIN, select)] == [report["id"]]
    assert (await _as(connection, ADMIN, "select public.is_admin() as admin"))[0]["admin"]
    assert not (await _as(connection, AUTHOR, "select public.is_admin() as admin"))[0]["admin"]


async def test_only_admins_can_change_or_delete_a_report(connection):
    report = await _send(connection, AUTHOR)
    update = "update public.feedback_reports set status = 'done' where id = $1 returning id"
    delete = "delete from public.feedback_reports where id = $1 returning id"
    assert await _as(connection, AUTHOR, update, report["id"]) == []
    assert await _as(connection, AUTHOR, delete, report["id"]) == []
    changed = await _as(connection, ADMIN, update + ", updated_at", report["id"])
    assert changed[0]["updated_at"] > report["updated_at"]
    assert len(await _as(connection, ADMIN, delete, report["id"])) == 1


async def test_authors_cannot_forge_fields_or_send_empty_reports(connection):
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        await _as(
            connection,
            AUTHOR,
            "insert into public.feedback_reports (kind, message, user_id) values ('bug', 'x', $1)",
            STRANGER,
        )
    with pytest.raises(asyncpg.InsufficientPrivilegeError):
        await _as(connection, AUTHOR, "select * from private.admins")
    with pytest.raises(asyncpg.CheckViolationError):
        await _send(connection, AUTHOR, "   ")


async def test_a_user_can_send_at_most_ten_reports_an_hour(connection):
    for _ in range(10):
        await _send(connection, AUTHOR)
    with pytest.raises(asyncpg.RaiseError, match="too many reports"):
        await _send(connection, AUTHOR)
