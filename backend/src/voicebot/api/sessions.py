from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field

from voicebot.domain.scenario import Language
from voicebot.domain.session import Consent, Session, SessionStatus
from voicebot.infrastructure.voice.runtime import InvalidSignaling
from voicebot.infrastructure.voice.webrtc import Answer, Candidates, Offer
from voicebot.settings import IceServerConfig

router = APIRouter(prefix="/sessions", tags=["sessions"])
bearer = HTTPBearer()


class ConsentChoice(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9._-]+$")
    voice: bool
    transcripts: bool
    improvement: bool = False
    outside_eu: bool


class CreateSession(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario_id: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    language: Language = Language.PL
    context: str = Field(default="", max_length=2000)
    consent: ConsentChoice


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scenario_id: str
    scenario_version: int
    language: str
    profile: str
    model: str
    status: SessionStatus
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    end_reason: str | None


class CreatedSession(SessionResponse):
    access_token: str
    token_expires_at: datetime
    transport: Literal["small_webrtc"] = "small_webrtc"
    signaling_url: str
    ice_servers: list[IceServerConfig]


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sequence: int
    session_id: UUID
    kind: str
    timestamp: datetime
    data: dict[str, str | bool | int | None]


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
        "context is optional background information for the conversation. "
        "Voice, transcript and non-EU processing consents are required; "
        "the consent record is stored as a consent.recorded event."
    ),
)
async def create_session(body: CreateSession, request: Request):
    consent = Consent(
        **body.consent.model_dump(),
        language=body.language.value,
        given_at=datetime.now(UTC),
    )
    session, token = await request.app.state.sessions.create(
        body.scenario_id, body.language, body.context, consent
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
