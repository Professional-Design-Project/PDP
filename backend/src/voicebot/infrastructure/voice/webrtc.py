from aiortc.sdp import candidate_from_sdp
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pydantic import BaseModel, ConfigDict, Field


class Offer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sdp: str = Field(min_length=1, max_length=100_000)
    type: str = Field(pattern="^offer$")
    pc_id: str | None = Field(default=None, max_length=200)
    restart_pc: bool = False


class Answer(BaseModel):
    sdp: str
    type: str
    pc_id: str


class Candidate(BaseModel):
    candidate: str = Field(max_length=4096)
    sdp_mid: str = Field(max_length=100)
    sdp_mline_index: int = Field(ge=0, le=10)


class Candidates(BaseModel):
    pc_id: str = Field(min_length=1, max_length=200)
    candidates: list[Candidate] = Field(max_length=30)


async def add_candidates(connection: SmallWebRTCConnection, candidates: list[Candidate]) -> None:
    for item in candidates:
        candidate = candidate_from_sdp(item.candidate) if item.candidate else None
        if candidate is not None:
            candidate.sdpMid = item.sdp_mid
            candidate.sdpMLineIndex = item.sdp_mline_index
        await connection.add_ice_candidate(candidate)
