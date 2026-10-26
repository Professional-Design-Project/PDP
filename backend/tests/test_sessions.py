from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from voicebot.domain.session import SessionConflict, SessionStatus
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.main import create_app
from voicebot.settings import Settings


def test_session_access_end_and_restart(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "sessions.sqlite3")
    with TestClient(create_app(settings)) as client:
        response = client.post("/v1/sessions", json={"scenario_id": "salary-negotiation"})
        assert response.status_code == 201
        session = response.json()
        url = f"/v1/sessions/{session['id']}"
        headers = {"Authorization": f"Bearer {session['access_token']}"}
        assert "token_hash" not in session
        assert "instructions" not in session
        assert client.get(url).status_code == 401
        assert client.get(url, headers={"Authorization": "Bearer wrong"}).status_code == 403
        assert client.get(url, headers=headers).json()["status"] == "created"
        assert client.post(url + "/end", headers=headers).json()["status"] == "ended"
        assert client.post(url + "/end", headers=headers).status_code == 200
        abandoned = client.post("/v1/sessions", json={"scenario_id": "salary-negotiation"}).json()
    with TestClient(create_app(settings)) as client:
        assert client.get(url, headers=headers).json()["status"] == "ended"
        recovered = client.get(
            f"/v1/sessions/{abandoned['id']}",
            headers={"Authorization": f"Bearer {abandoned['access_token']}"},
        ).json()
        assert recovered["status"] == "failed"
        assert recovered["end_reason"] == "server_restarted"


async def test_session_domain_and_storage(tmp_path):
    from voicebot.application.sessions import Sessions

    database = await Database.open(tmp_path / "test.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        session, token = await sessions.create("salary-negotiation")
        assert token not in (await database.get(session.id)).token_hash
        with pytest.raises(SessionConflict):
            session.transition(SessionStatus.ACTIVE, datetime.now(UTC))
        await sessions.transition(session.id, SessionStatus.CONNECTING)
        active = await sessions.transition(session.id, SessionStatus.ACTIVE)
        assert active.started_at is not None
        assert active.instructions == session.instructions
    finally:
        await database.close()
