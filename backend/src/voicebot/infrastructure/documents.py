from io import BytesIO
from pathlib import PurePath

from voicebot.application.documents import (
    SUPPORTED_EXTENSIONS,
    ExtractedText,
    UnsupportedDocument,
    limit_text,
)


def _pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _docx(data: bytes) -> str:
    from docx import Document

    document = Document(BytesIO(data))
    parts = [paragraph.text for paragraph in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            parts.append(" | ".join(cell.text for cell in row.cells))
    return "\n".join(parts)


def _pptx(data: bytes) -> str:
    from pptx import Presentation

    presentation = Presentation(BytesIO(data))
    parts = []
    for number, slide in enumerate(presentation.slides, start=1):
        parts.append(f"Slide {number}")
        for shape in slide.shapes:
            if shape.has_text_frame:
                parts.append(shape.text_frame.text)
    return "\n".join(parts)


def _text(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


READERS = {".pdf": _pdf, ".docx": _docx, ".pptx": _pptx, ".txt": _text, ".md": _text}


def extract_text(filename: str, data: bytes) -> ExtractedText:
    extension = PurePath(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise UnsupportedDocument(extension)
    try:
        raw = READERS[extension](data)
    except Exception as error:
        raise UnsupportedDocument(extension) from error
    return limit_text(raw)
