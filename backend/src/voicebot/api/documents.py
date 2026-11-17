import asyncio
from typing import Annotated

from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel

from voicebot.api.auth import CurrentUser
from voicebot.application.documents import MAX_FILE_BYTES, DocumentTooLarge
from voicebot.infrastructure.documents import extract_text

router = APIRouter(prefix="/documents", tags=["documents"])


class ExtractedDocument(BaseModel):
    name: str
    text: str
    chars: int
    truncated: bool


@router.post(
    "/extract",
    response_model=ExtractedDocument,
    summary="Extract plain text from a document for the conversation context",
    description=(
        "Accepts PDF, DOCX, PPTX, TXT and MD files up to 10 MB. The file is read in memory and "
        "not stored. The returned text is limited to 20,000 characters; pass it in the "
        "documents field when creating a session."
    ),
)
async def extract(file: Annotated[UploadFile, File()], user: CurrentUser):
    data = await file.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise DocumentTooLarge
    name = (file.filename or "document")[:200]
    result = await asyncio.to_thread(extract_text, name, data)
    return ExtractedDocument(
        name=name, text=result.text, chars=len(result.text), truncated=result.truncated
    )
