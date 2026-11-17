from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from voicebot.application.documents import (
    MAX_DOCUMENT_CHARS,
    MAX_DOCUMENTS,
    MAX_TOTAL_CHARS,
    DocumentKind,
)
from voicebot.application.feedback import FeedbackKind
from voicebot.domain.scenario import Language
from voicebot.domain.session import SessionStatus
from voicebot.settings import IceServerConfig


class ConsentChoice(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9._-]+$")
    voice: bool
    transcripts: bool
    improvement: bool = False
    outside_eu: bool
    language: Language | None = None


class DocumentInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    kind: DocumentKind = "other"
    text: str = Field(min_length=1, max_length=MAX_DOCUMENT_CHARS)


class CreateSession(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario_id: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    language: Language = Language.PL
    context: str = Field(default="", max_length=2000)
    consent: ConsentChoice
    documents: list[DocumentInput] = Field(default_factory=list, max_length=MAX_DOCUMENTS)

    @model_validator(mode="after")
    def documents_fit(self):
        if sum(len(document.text) for document in self.documents) > MAX_TOTAL_CHARS:
            raise ValueError(f"Documents can hold at most {MAX_TOTAL_CHARS} characters in total")
        return self


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


class FeedbackNoteResponse(BaseModel):
    kind: FeedbackKind
    title: str
    quote: str
    advice: str
    sequence: int | None


class FeedbackResponse(BaseModel):
    summary: str
    notes: list[FeedbackNoteResponse]


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sequence: int
    session_id: UUID
    kind: str
    timestamp: datetime
    data: dict[str, str | bool | int | None]
