from fastapi.testclient import TestClient

from voicebot.main import create_app
from voicebot.settings import Settings

CONSENT = {"version": "test", "voice": True, "transcripts": True, "outside_eu": True}


def test_health_and_versioned_schema(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    with TestClient(create_app(settings)) as client:
        assert client.get("/v1/health").json()["status"] == "ok"
        assert client.get("/health").status_code == 404
        assert client.get("/v1/openapi.json").status_code == 200
        session = client.post(
            "/v1/sessions",
            json={
                "scenario_id": "job-interview",
                "language": "en",
                "context": "The candidate is applying for a Java Backend Intern role.",
                "consent": CONSENT,
            },
        )
        assert session.status_code == 201
        assert session.json()["language"] == "en"
        assert (
            client.post(
                "/v1/sessions",
                json={"scenario_id": "job-interview", "context": "x" * 2001},
            ).status_code
            == 422
        )


def test_sessions_require_and_record_consent(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    with TestClient(create_app(settings)) as client:
        body = {"scenario_id": "oral-exam", "language": "en"}
        assert client.post("/v1/sessions", json=body).status_code == 422
        refused = client.post(
            "/v1/sessions", json={**body, "consent": {**CONSENT, "outside_eu": False}}
        )
        assert refused.status_code == 400
        assert refused.json()["detail"] == "Required consent missing"
        created = client.post(
            "/v1/sessions", json={**body, "consent": {**CONSENT, "improvement": True}}
        ).json()
        headers = {"Authorization": f"Bearer {created['access_token']}"}
        events = client.get(f"/v1/sessions/{created['id']}/events", headers=headers).json()
        record = next(event for event in events if event["kind"] == "consent.recorded")
        assert record["data"]["version"] == "test"
        assert record["data"]["improvement"] is True
        assert record["data"]["language"] == "en"
        shown_in_polish = client.post(
            "/v1/sessions", json={**body, "consent": {**CONSENT, "language": "pl"}}
        ).json()
        headers = {"Authorization": f"Bearer {shown_in_polish['access_token']}"}
        url = f"/v1/sessions/{shown_in_polish['id']}/events"
        events = client.get(url, headers=headers).json()
        polish = next(event for event in events if event["kind"] == "consent.recorded")
        assert polish["data"]["language"] == "pl"
        assert record["data"]["given_at"]
