from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi.testclient import TestClient
from google.genai import errors

from voicebot.application.feedback import (
    Feedback,
    FeedbackFailed,
    FeedbackFailure,
    FeedbackNote,
    FeedbackRequest,
    FeedbackUnavailable,
    feedback_instructions,
    feedback_prompt,
)
from voicebot.application.sessions import Sessions
from voicebot.domain.scenario import Language
from voicebot.domain.session import SessionConflict, SessionStatus
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.feedback import GeminiFeedbackWriter
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.main import create_app
from voicebot.settings import Settings


class FakeWriter:
    def __init__(self) -> None:
        self.requests: list[FeedbackRequest] = []

    async def write(self, request: FeedbackRequest) -> Feedback:
        self.requests.append(request)
        return Feedback(
            summary="A clear start.",
            notes=[
                FeedbackNote(
                    kind="strength",
                    title="Clear opening",
                    quote="I led it",
                    advice="Keep it.",
                    line=2,
                ),
                FeedbackNote(
                    kind="work_on", title="Out of range", quote="x", advice="Drop it.", line=99
                ),
            ],
        )


class NotesWriter:
    def __init__(self, notes: list[FeedbackNote]) -> None:
        self.notes = notes

    async def write(self, request: FeedbackRequest) -> Feedback:
        return Feedback(summary="Needs more detail.", notes=self.notes)


def note(quote: str, line: int) -> FeedbackNote:
    return FeedbackNote(
        kind="work_on", title="Be specific", quote=quote, advice="Give an example.", line=line
    )


async def test_feedback_accepts_only_user_quotes_from_the_referenced_line(tmp_path):
    database = await Database.open(tmp_path / "test.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        session, _ = await sessions.create("job-interview", Language.EN, "")
        await sessions.transcript(session.id, "assistant", "Tell me about a project.", False, "")
        await sessions.transcript(session.id, "user", "I built an application.", False, "")
        await sessions.transcript(session.id, "user", "I used Java.", False, "")
        await sessions.transition(session.id, SessionStatus.ENDED, "user_ended")
        writer = NotesWriter(
            [
                note("built an application", 2),
                note("Tell me", 1),
                note("I used Java", 2),
                note("missing", 99),
            ]
        )
        feedback, _ = await sessions.feedback(session.id, writer)
        assert [item.quote for item in feedback.notes] == ["built an application"]
        assert feedback.notes[0].kind == "work_on"
    finally:
        await database.close()


async def test_feedback_fails_when_no_quote_is_valid(tmp_path):
    database = await Database.open(tmp_path / "test.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        session, _ = await sessions.create("job-interview", Language.EN, "")
        await sessions.transcript(session.id, "user", "I used Java.", False, "")
        await sessions.transition(session.id, SessionStatus.ENDED, "user_ended")
        with pytest.raises(FeedbackFailed):
            await sessions.feedback(session.id, NotesWriter([note("invented", 1)]))
    finally:
        await database.close()


async def test_feedback_is_generated_once_from_the_transcript(tmp_path):
    database = await Database.open(tmp_path / "test.sqlite3")
    try:
        sessions = Sessions(database, load_scenarios(), "test-model")
        session, _ = await sessions.create("job-interview", Language.EN, "Backend role")
        writer = FakeWriter()
        with pytest.raises(SessionConflict):
            await sessions.feedback(session.id, writer)
        await sessions.transcript(session.id, "assistant", "Tell me about a project.", False, "")
        await sessions.transition(session.id, SessionStatus.ENDED, "user_ended")
        with pytest.raises(FeedbackUnavailable):
            await sessions.feedback(session.id, writer)

        other, _ = await sessions.create("job-interview", Language.EN, "Backend role")
        await sessions.transcript(other.id, "assistant", "Tell me about a project.", False, "")
        await sessions.transcript(other.id, "user", "I led it.", False, "")
        await sessions.transition(other.id, SessionStatus.ENDED, "user_ended")
        feedback, sequences = await sessions.feedback(other.id, writer)
        assert [note.title for note in feedback.notes] == ["Clear opening"]
        assert len(sequences) == 2
        request = writer.requests[0]
        assert request.context == "Backend role"
        assert request.lines[1] == (2, "user", "I led it.")
        again, _ = await sessions.feedback(other.id, writer)
        assert again == feedback
        assert len(writer.requests) == 1
    finally:
        await database.close()


def test_feedback_prompt_is_transcript_only():
    request = FeedbackRequest("Oral exam", Language.PL, "", [(1, "user", "Proces to program.")])
    instructions = feedback_instructions(request)
    assert "Polish" in instructions
    assert "Do not infer emotions" in instructions
    assert "1. User: Proces to program." in feedback_prompt(request)
    assert "<context>" not in feedback_prompt(request)


def test_feedback_endpoint_rejects_running_sessions(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    consent = {"version": "test", "voice": True, "transcripts": True, "outside_eu": True}
    with TestClient(create_app(settings, feedback_writer=FakeWriter())) as client:
        created = client.post(
            "/v1/sessions", json={"scenario_id": "job-interview", "consent": consent}
        ).json()
        headers = {"Authorization": f"Bearer {created['access_token']}"}
        url = f"/v1/sessions/{created['id']}"
        running = client.post(url + "/feedback", headers=headers)
        assert running.status_code == 409
        assert running.json()["code"] == "session_conflict"
        client.post(url + "/end", headers=headers)
        response = client.post(url + "/feedback", headers=headers)
        assert response.status_code == 409
        assert response.json()["detail"] == "Not enough answers for feedback"
        assert response.json()["code"] == "feedback_unavailable"


@pytest.mark.parametrize(
    ("status", "code"),
    [
        (429, FeedbackFailure.RATE_LIMITED),
        (503, FeedbackFailure.PROVIDER_UNAVAILABLE),
        (404, FeedbackFailure.NOT_CONFIGURED),
        (400, FeedbackFailure.REQUEST_REJECTED),
    ],
)
async def test_provider_errors_are_classified_without_exposing_details(status, code, caplog):
    writer = GeminiFeedbackWriter("test-key", "test-model")
    writer.client = SimpleNamespace(
        aio=SimpleNamespace(
            models=SimpleNamespace(
                generate_content=AsyncMock(
                    side_effect=errors.APIError(
                        status, {"error": {"message": "private provider detail"}}
                    )
                )
            )
        )
    )
    request = FeedbackRequest("Interview", Language.EN, "", [(1, "user", "Hello")])
    with pytest.raises(FeedbackFailed) as caught:
        await writer.write(request)
    assert caught.value.reason == code
    assert "private provider detail" not in caplog.text


def test_feedback_endpoint_exposes_safe_provider_error_code(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    consent = {"version": "test", "voice": True, "transcripts": True, "outside_eu": True}
    with TestClient(create_app(settings, feedback_writer=FakeWriter())) as client:
        created = client.post(
            "/v1/sessions", json={"scenario_id": "job-interview", "consent": consent}
        ).json()
        client.app.state.sessions.feedback = AsyncMock(
            side_effect=FeedbackFailed(FeedbackFailure.PROVIDER_UNAVAILABLE)
        )
        response = client.post(
            f"/v1/sessions/{created['id']}/feedback",
            headers={"Authorization": f"Bearer {created['access_token']}"},
        )
        assert response.status_code == 503
        assert response.json() == {
            "detail": "Feedback provider is temporarily unavailable",
            "code": "feedback_provider_unavailable",
        }


@pytest.mark.parametrize("error", [httpx.ConnectError("private"), TimeoutError("private")])
async def test_provider_connection_failure_is_translated(error):
    writer = GeminiFeedbackWriter("test-key", "test-model")
    writer.client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=AsyncMock(side_effect=error)))
    )
    with pytest.raises(FeedbackFailed) as caught:
        await writer.write(FeedbackRequest("Interview", Language.EN, "", []))
    assert caught.value.reason == FeedbackFailure.PROVIDER_UNAVAILABLE


async def test_unexpected_provider_adapter_error_is_not_disguised():
    writer = GeminiFeedbackWriter("test-key", "test-model")
    writer.client = SimpleNamespace(
        aio=SimpleNamespace(
            models=SimpleNamespace(generate_content=AsyncMock(side_effect=TypeError))
        )
    )
    with pytest.raises(TypeError):
        await writer.write(FeedbackRequest("Interview", Language.EN, "", []))


async def test_invalid_provider_response_is_translated():
    writer = GeminiFeedbackWriter("test-key", "test-model")
    writer.client = SimpleNamespace(
        aio=SimpleNamespace(
            models=SimpleNamespace(
                generate_content=AsyncMock(return_value=SimpleNamespace(text="{}"))
            )
        )
    )
    with pytest.raises(FeedbackFailed) as caught:
        await writer.write(FeedbackRequest("Interview", Language.EN, "", []))
    assert caught.value.reason == FeedbackFailure.INVALID_RESPONSE


@pytest.mark.parametrize(
    ("reason", "status", "code"),
    [
        (FeedbackFailure.RATE_LIMITED, 503, "feedback_rate_limited"),
        (FeedbackFailure.PROVIDER_UNAVAILABLE, 503, "feedback_provider_unavailable"),
        (FeedbackFailure.NOT_CONFIGURED, 503, "feedback_not_configured"),
        (FeedbackFailure.INVALID_RESPONSE, 502, "feedback_invalid_response"),
        (FeedbackFailure.REQUEST_REJECTED, 502, "feedback_request_rejected"),
    ],
)
def test_feedback_failures_have_stable_http_contract(tmp_path, reason, status, code):
    settings = Settings(_env_file=None, database_path=tmp_path / "test.sqlite3")
    consent = {"version": "test", "voice": True, "transcripts": True, "outside_eu": True}
    with TestClient(create_app(settings, feedback_writer=FakeWriter())) as client:
        created = client.post(
            "/v1/sessions", json={"scenario_id": "job-interview", "consent": consent}
        ).json()
        client.app.state.sessions.feedback = AsyncMock(side_effect=FeedbackFailed(reason))
        response = client.post(
            f"/v1/sessions/{created['id']}/feedback",
            headers={"Authorization": f"Bearer {created['access_token']}"},
        )
        assert response.status_code == status
        assert response.json()["code"] == code


def test_error_responses_have_codes_and_do_not_expose_unexpected_exception(tmp_path, caplog):
    app = create_app(Settings(_env_file=None, database_path=tmp_path / "test.sqlite3"))

    @app.get("/failure")
    async def failure():
        raise RuntimeError("private transcript")

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/failure")
        assert response.status_code == 500
        assert response.json() == {"code": "internal_error", "detail": "Internal server error"}
        assert "private transcript" not in caplog.text
        assert client.get("/missing").json()["code"] == "http_error"
        invalid = client.post("/v1/sessions", json={})
        assert invalid.status_code == 422
        assert invalid.json()["code"] == "validation_error"
        assert isinstance(invalid.json()["detail"], list)
