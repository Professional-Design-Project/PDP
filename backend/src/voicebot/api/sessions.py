from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from voicebot.api.auth import CurrentUser
from voicebot.api.session_schemas import (
    CreatedSession,
    CreateSession,
    EventResponse,
    FeedbackNoteResponse,
    FeedbackResponse,
    SessionResponse,
)
from voicebot.application.documents import Document
from voicebot.application.interview_style import InterviewStyle
from voicebot.domain.session import Consent, Session
from voicebot.infrastructure.voice.runtime import InvalidSignaling
from voicebot.infrastructure.voice.webrtc import Answer, Candidates, Offer

router = APIRouter(prefix="/sessions", tags=["sessions"])
bearer = HTTPBearer()


async def authorized_session(
    session_id: UUID,
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
) -> Session:
    return await request.app.state.sessions.authorize(str(session_id), credentials.credentials)


AuthorizedSession = Annotated[Session, Depends(authorized_session)]


@router.post(
    "",
    response_model=CreatedSession,
    status_code=201,
    summary="Create a session and issue its access token",
    description=(
        "Use the access token as Bearer authorization on all session endpoints. "
        "Connect using SmallWebRTC and the returned signaling URL. "
        "The selected localized scenario defines the conversation language; "
        "context is optional background information for the conversation, "
        "and style tunes the question focus, precision, pressure and follow-ups. "
        "Voice, transcript and non-EU processing consents are required; "
        "the consent record is stored as a consent.recorded event."
    ),
)
async def create_session(body: CreateSession, request: Request, user: CurrentUser):
    choice = body.consent
    consent = Consent(
        version=choice.version,
        voice=choice.voice,
        transcripts=choice.transcripts,
        improvement=choice.improvement,
        outside_eu=choice.outside_eu,
        language=(choice.language or body.language).value,
        given_at=datetime.now(UTC),
    )
    session, token = await request.app.state.sessions.create(
        body.scenario_id,
        body.language,
        body.context,
        consent,
        tuple(Document(item.name, item.kind, item.text) for item in body.documents),
        user.user_id if user else None,
        InterviewStyle(**body.style.model_dump()),
    )
    settings = request.app.state.settings
    return CreatedSession(
        **SessionResponse.model_validate(session).model_dump(),
        access_token=token,
        token_expires_at=session.created_at + timedelta(seconds=settings.session_token_ttl_seconds),
        signaling_url=f"/v1/sessions/{session.id}/offer",
        ice_servers=settings.ice_servers,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session: AuthorizedSession):
    return session


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(session: AuthorizedSession, request: Request):
    return await request.app.state.runtime.end(session.id)


@router.post(
    "/{session_id}/offer",
    response_model=Answer,
    summary="Exchange a SmallWebRTC SDP offer for an answer",
    description=(
        "Send an offer with an audio transceiver and a data channel. "
        "For renegotiation include the returned pc_id. "
        "Peer restarts require a new session. Use Pipecat RTVI on the data channel."
    ),
)
async def offer(session: AuthorizedSession, body: Offer, request: Request):
    try:
        return await request.app.state.runtime.offer(session.id, body)
    except (ValueError, AssertionError) as error:
        raise InvalidSignaling from error


@router.patch(
    "/{session_id}/offer",
    status_code=204,
    summary="Add trickled ICE candidates to this session's peer",
)
async def candidates(session: AuthorizedSession, body: Candidates, request: Request):
    await request.app.state.runtime.candidates(session.id, body)


@router.post(
    "/{session_id}/feedback",
    response_model=FeedbackResponse,
    summary="Create AI feedback from the finished session transcript",
    description=(
        "Available after the session has ended. Feedback is based only on the transcript text "
        "and is generated once, then returned from storage on later calls. "
        "Each note links to the transcript segment it quotes by sequence."
    ),
)
async def feedback(session: AuthorizedSession, request: Request):
    result, sequences = await request.app.state.sessions.feedback(
        session.id, request.app.state.feedback_writer
    )
    return FeedbackResponse(
        summary=result.summary,
        notes=[
            FeedbackNoteResponse(
                kind=note.kind,
                title=note.title,
                quote=note.quote,
                advice=note.advice,
                sequence=sequences[note.line - 1] if note.line <= len(sequences) else None,
            )
            for note in result.notes
        ],
    )


@router.get(
    "/{session_id}/transcript",
    response_model=list[EventResponse],
    description=(
        "Finalized transcript segments ordered by sequence. "
        "Pass the last sequence as after to retrieve the next page. "
        "Interrupted assistant text is not proof of what was heard; playback is not verified. "
        "Live partial transcripts are provided by RTVI and are not stored as final segments."
    ),
)
async def transcript(
    session: AuthorizedSession,
    request: Request,
    after: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    return await request.app.state.sessions.events(
        session.id, after, limit, kind="transcript.final"
    )


@router.get(
    "/{session_id}/events",
    response_model=list[EventResponse],
    description="Lifecycle and transcript events ordered by sequence, with cursor pagination.",
)
async def events(
    session: AuthorizedSession,
    request: Request,
    after: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    return await request.app.state.sessions.events(session.id, after, limit)
