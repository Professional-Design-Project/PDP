from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field

from voicebot.domain.session import Session, SessionStatus
from voicebot.infrastructure.voice.runtime import InvalidSignaling
from voicebot.infrastructure.voice.webrtc import Answer, Candidates, Offer

router = APIRouter(prefix="/sessions", tags=["sessions"])
bearer = HTTPBearer()


class CreateSession(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario_id: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")


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
    transport: str = "small_webrtc"


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


@router.post("", response_model=CreatedSession, status_code=201)
async def create_session(body: CreateSession, request: Request):
    session, token = await request.app.state.sessions.create(body.scenario_id)
    return CreatedSession(
        **SessionResponse.model_validate(session).model_dump(), access_token=token
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session: AuthorizedSession):
    return session


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(session: AuthorizedSession, request: Request):
    return await request.app.state.runtime.end(session.id)


@router.post("/{session_id}/offer", response_model=Answer)
async def offer(session: AuthorizedSession, body: Offer, request: Request):
    try:
        return await request.app.state.runtime.offer(session.id, body)
    except (ValueError, AssertionError) as error:
        raise InvalidSignaling from error


@router.patch("/{session_id}/offer", status_code=204)
async def candidates(session: AuthorizedSession, body: Candidates, request: Request):
    await request.app.state.runtime.candidates(session.id, body)


@router.get("/{session_id}/transcript", response_model=list[EventResponse])
async def transcript(
    session: AuthorizedSession,
    request: Request,
    after: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    return await request.app.state.sessions.events(
        session.id, after, limit, kind="transcript.final"
    )
