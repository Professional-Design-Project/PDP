from fastapi.testclient import TestClient

from voicebot.main import create_app
from voicebot.settings import Settings


def test_health_and_versioned_schema(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    with TestClient(create_app(settings)) as client:
        assert client.get("/v1/health").json()["status"] == "ok"
        assert client.get("/health").status_code == 404
        assert client.get("/v1/openapi.json").status_code == 200
