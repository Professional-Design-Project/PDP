from fastapi.testclient import TestClient

from voicebot.main import create_app
from voicebot.settings import Settings


def test_health_and_versioned_schema(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    with TestClient(create_app(settings)) as client:
        assert client.get("/v1/health").json()["status"] == "ok"
        assert client.get("/health").status_code == 404
        assert client.get("/v1/openapi.json").status_code == 200
        session = client.post(
            "/v1/sessions",
            json={
                "scenario_id": "salary-negotiation",
                "language": "en",
                "context": "The candidate is applying for a senior role.",
            },
        )
        assert session.status_code == 201
        assert session.json()["language"] == "en"
        assert client.post(
            "/v1/sessions",
            json={"scenario_id": "salary-negotiation", "context": "x" * 2001},
        ).status_code == 422
