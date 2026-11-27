import json

import httpx
import pytest
from fastapi.testclient import TestClient

from voicebot.application.feedback import FeedbackFailed, FeedbackFailure, FeedbackRequest
from voicebot.domain.scenario import Language
from voicebot.infrastructure.feedback import OpenRouterFeedbackWriter
from voicebot.main import create_app
from voicebot.settings import Settings

REQUEST = FeedbackRequest("Interview", Language.EN, "", [(1, "user", "I built it")])


def mock_http(monkeypatch, handler):
    client = httpx.AsyncClient
    monkeypatch.setattr(
        "voicebot.infrastructure.feedback.httpx.AsyncClient",
        lambda **kwargs: client(transport=httpx.MockTransport(handler), **kwargs),
    )


async def test_openrouter_feedback_sends_structured_request_and_validates_response(monkeypatch):
    def respond(request):
        body = json.loads(request.content)
        assert body["model"] == "test/model"
        assert body["response_format"]["type"] == "json_schema"
        assert "I built it" in body["messages"][1]["content"]
        assert request.headers["authorization"] == "Bearer fake-key"
        content = {
            "summary": "A concrete answer.",
            "notes": [
                {
                    "kind": "strength",
                    "title": "Specific",
                    "quote": "I built it",
                    "advice": "Add detail.",
                    "line": 1,
                }
            ],
        }
        return httpx.Response(
            200, json={"choices": [{"message": {"content": json.dumps(content)}}]}
        )

    mock_http(monkeypatch, respond)
    feedback = await OpenRouterFeedbackWriter("fake-key", "test/model").write(REQUEST)
    assert feedback.notes[0].quote == "I built it"


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (401, FeedbackFailure.NOT_CONFIGURED),
        (429, FeedbackFailure.RATE_LIMITED),
        (500, FeedbackFailure.PROVIDER_UNAVAILABLE),
        (400, FeedbackFailure.REQUEST_REJECTED),
    ],
)
async def test_openrouter_feedback_maps_http_errors(monkeypatch, status, expected):
    mock_http(monkeypatch, lambda request: httpx.Response(status))
    with pytest.raises(FeedbackFailed) as error:
        await OpenRouterFeedbackWriter("fake-key", "test/model").write(REQUEST)
    assert error.value.reason == expected


async def test_openrouter_feedback_rejects_invalid_output(monkeypatch):
    mock_http(monkeypatch, lambda request: httpx.Response(200, json={"choices": []}))
    with pytest.raises(FeedbackFailed) as error:
        await OpenRouterFeedbackWriter("fake-key", "test/model").write(REQUEST)
    assert error.value.reason == FeedbackFailure.INVALID_RESPONSE


def test_feedback_provider_is_selected_independently_of_voice(tmp_path):
    settings = Settings(
        _env_file=None,
        database_path=tmp_path / "test.sqlite3",
        feedback_provider="openrouter",
        openrouter_api_key="fake-key",
        google_api_key="",
    )
    app = create_app(settings)
    with TestClient(app):
        assert isinstance(app.state.feedback_writer, OpenRouterFeedbackWriter)
        assert app.state.runtime.engine.profile == "gemini_live"
