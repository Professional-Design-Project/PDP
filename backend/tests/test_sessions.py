from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from voicebot.domain.session import SessionConflict, SessionStatus
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.main import create_app
from voicebot.settings import Settings

CONSENT = {"version": "test", "voice": True, "transcripts": True, "outside_eu": True}
CREATE = {"scenario_id": "job-interview", "consent": CONSENT}


def test_session_access_end_and_restart(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "sessions.sqlite3")
    with TestClient(create_app(settings)) as client:
        response = client.post("/v1/sessions", json=CREATE)
        assert response.status_code == 201
        session = response.json()
        assert response.headers["cache-control"] == "no-store"
        assert session["signaling_url"] == f"/v1/sessions/{session['id']}/offer"
        url = f"/v1/sessions/{session['id']}"
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        assert "token_hash" not in session
        assert "instructions" not in session
        assert client.get(url).status_code == 401
        assert client.get(url, headers={"Authorization": "Bearer wrong"}).status_code == 403
        assert client.get(url, headers=headers).json()["status"] == "created"
        assert client.get(url + "/events", headers=headers).json()[0]["kind"] == "session.created"
        assert client.get(url + "/transcript", headers=headers).json() == []
        assert client.post(url + "/end", headers=headers).json()["status"] == "ended"
        assert client.post(url + "/end", headers=headers).status_code == 200
        abandoned = client.post("/v1/sessions", json=CREATE).json()
    with TestClient(create_app(settings)) as client:
        assert client.get(url, headers=headers).json()["status"] == "ended"
        recovered = client.get(
            f"/v1/sessions/{abandoned['id']}",
            headers={"Authorization": f"Bearer {abandoned['access_token']}"},
        ).json()
        assert recovered["status"] == "failed"
        assert recovered["end_reason"] == "server_restarted"


async def test_session_domain_and_storage(tmp_path):
    from voicebot.application.sessions import SessionLimitExceeded, Sessions

    database = await Database.open(tmp_path / "test.sqlite3")
    try:
        with pytest.raises(RuntimeError, match="one backend process"):
            await Database.open(tmp_path / "test.sqlite3")
        sessions = Sessions(database, load_scenarios(), "test-model", max_sessions=2)
        session, token = await sessions.create(
            "job-interview", "pl", "The candidate is applying for a Java Backend Intern role."
        )
        assert token not in (await database.get(session.id)).token_hash
        assert "Java Backend Intern role" in session.instructions
        with pytest.raises(SessionConflict):
            session.transition(SessionStatus.ACTIVE, datetime.now(UTC))
        await sessions.transition(session.id, SessionStatus.CONNECTING)
        active = await sessions.transition(session.id, SessionStatus.ACTIVE)
        assert active.started_at is not None
        assert active.instructions == session.instructions
        other, _ = await sessions.create("job-interview", "en")
        with pytest.raises(SessionLimitExceeded):
            await sessions.create("job-interview", "pl")
        await sessions.expire_pending(0)
        assert (await sessions.get(other.id)).end_reason == "connection_timeout"
        assert (await sessions.get(session.id)).status == "active"
        await sessions.transcript(session.id, "assistant", "Dzień dobry", True, "")
        entries = await database.events(session.id, kind="transcript.final")
        assert len(entries) == 1
        assert entries[0].data["interrupted"] is True
        assert await database.events(other.id, kind="transcript.final") == []
    finally:
        await database.close()


async def test_document_text_reaches_the_conversation_but_is_not_stored(tmp_path):
    from voicebot.application.documents import Document
    from voicebot.application.sessions import Sessions

    database = await Database.open(tmp_path / "test.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        cv = Document("cv.pdf", "cv", "Built a payments ledger in Kotlin.")
        session, _ = await sessions.create("job-interview", "en", "Backend role", documents=(cv,))

        stored = await database.get(session.id)
        assert "payments ledger" not in stored.instructions
        assert "Backend role" in stored.instructions
        assert "payments ledger" in (await sessions.for_conversation(session.id)).instructions

        await sessions.transition(session.id, SessionStatus.ENDED, "user_ended")
        assert "payments ledger" not in (await sessions.for_conversation(session.id)).instructions
    finally:
        await database.close()
