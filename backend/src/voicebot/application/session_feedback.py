from voicebot.application.feedback import (
    Feedback,
    FeedbackFailed,
    FeedbackFailure,
    FeedbackRequest,
    FeedbackUnavailable,
    FeedbackWriter,
)
from voicebot.application.ports import SessionRepository
from voicebot.application.scenarios import Scenarios
from voicebot.domain.scenario import Language
from voicebot.domain.session import Session, SessionConflict, SessionEvent


async def session_feedback(
    repository: SessionRepository,
    scenarios: Scenarios,
    session: Session,
    writer: FeedbackWriter | None,
) -> tuple[Feedback, list[int]]:
    if not session.finished:
        raise SessionConflict("Session is still running")
    events = await repository.events(session.id, limit=500, kind="transcript.final")
    turns = [event for event in events if str(event.data.get("text") or "").strip()]
    sequences = [event.sequence for event in turns]
    cached = await repository.events(session.id, limit=500, kind="feedback.created")
    if cached:
        return Feedback.model_validate_json(str(cached[-1].data["payload"])), sequences
    if not any(event.data.get("role") == "user" for event in turns):
        raise FeedbackUnavailable
    if writer is None:
        raise FeedbackFailed(FeedbackFailure.NOT_CONFIGURED)
    feedback = await _write(scenarios, session, turns, writer)
    await repository.append_event(
        session.id, "feedback.created", {"payload": feedback.model_dump_json()}
    )
    return feedback, sequences


async def _write(
    scenarios: Scenarios,
    session: Session,
    turns: list[SessionEvent],
    writer: FeedbackWriter,
) -> Feedback:
    language = Language(session.language)
    scenario = scenarios.get(session.scenario_id, language)
    lines = [
        (index, str(event.data["role"]), str(event.data["text"]).strip())
        for index, event in enumerate(turns, start=1)
    ]
    feedback = await writer.write(
        FeedbackRequest(scenario.title, language, session.context, lines, scenario.feedback_focus)
    )
    notes = [
        note
        for note in feedback.notes
        if note.line <= len(lines)
        and lines[note.line - 1][1] == "user"
        and note.quote in lines[note.line - 1][2]
    ]
    if not notes:
        raise FeedbackFailed(FeedbackFailure.INVALID_RESPONSE)
    return feedback.model_copy(update={"notes": notes})
