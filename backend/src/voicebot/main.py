import asyncio
import logging
import sys
import traceback
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger as pipecat_logger
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from voicebot.api.account import router as account_router
from voicebot.api.auth import AuthenticationRequired
from voicebot.api.documents import router as documents_router
from voicebot.api.scenarios import scenario_router
from voicebot.api.sessions import router as sessions_router
from voicebot.application.documents import DocumentTooLarge, EmptyDocument, UnsupportedDocument
from voicebot.application.feedback import FeedbackFailed, FeedbackFailure, FeedbackUnavailable
from voicebot.application.scenarios import ScenarioNotFound
from voicebot.application.sessions import (
    SessionAccessDenied,
    SessionLimitExceeded,
    SessionNotFound,
    Sessions,
)
from voicebot.domain.session import ConsentRequired, SessionConflict
from voicebot.infrastructure.auth import SupabaseAuth
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.feedback import GeminiFeedbackWriter
from voicebot.infrastructure.postgres import PostgresDatabase
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.infrastructure.supabase_admin import AccountDeletionFailed, SupabaseAdmin
from voicebot.infrastructure.voice.active_session import InvalidSignaling
from voicebot.infrastructure.voice.gemini import VoiceUnavailable
from voicebot.infrastructure.voice.runtime import VoiceRuntime
from voicebot.settings import Settings


class ErrorResponse(BaseModel):
    code: str
    detail: str | list[dict]


logger = logging.getLogger(__name__)


APPLICATION_ERRORS = {
    AuthenticationRequired: (401, "authentication_required", "Sign in required"),
    AccountDeletionFailed: (503, "account_deletion_failed", "Account deletion is not available"),
    ScenarioNotFound: (404, "scenario_not_found", "Scenario not found"),
    ConsentRequired: (400, "consent_required", "Required consent missing"),
    SessionNotFound: (404, "session_not_found", "Session not found"),
    SessionAccessDenied: (403, "session_access_denied", "Session access denied"),
    SessionConflict: (409, "session_conflict", "Session state conflict"),
    InvalidSignaling: (400, "invalid_signaling", "Invalid WebRTC signaling"),
    VoiceUnavailable: (503, "voice_unavailable", "Voice provider is not configured"),
    SessionLimitExceeded: (503, "session_limit_exceeded", "Session capacity reached"),
    TimeoutError: (504, "voice_timeout", "Voice connection timed out"),
    FeedbackUnavailable: (409, "feedback_unavailable", "Not enough answers for feedback"),
    UnsupportedDocument: (415, "unsupported_document", "Unsupported or unreadable document"),
    DocumentTooLarge: (413, "document_too_large", "Document is larger than 10 MB"),
    EmptyDocument: (422, "empty_document", "No text found in the document"),
}

FEEDBACK_ERRORS = {
    FeedbackFailure.RATE_LIMITED: (
        503,
        "feedback_rate_limited",
        "Feedback provider rate limit reached",
    ),
    FeedbackFailure.PROVIDER_UNAVAILABLE: (
        503,
        "feedback_provider_unavailable",
        "Feedback provider is temporarily unavailable",
    ),
    FeedbackFailure.NOT_CONFIGURED: (
        503,
        "feedback_not_configured",
        "Feedback provider is not configured correctly",
    ),
    FeedbackFailure.INVALID_RESPONSE: (
        502,
        "feedback_invalid_response",
        "Feedback provider returned an invalid response",
    ),
    FeedbackFailure.REQUEST_REJECTED: (
        502,
        "feedback_request_rejected",
        "Feedback provider rejected the request",
    ),
}


def create_app(
    settings: Settings | None = None, feedback_writer=None, auth=None, admin=None
) -> FastAPI:
    settings = settings or Settings()
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("aiortc.rtcdtlstransport").setLevel(logging.DEBUG)
    # Keep transport/provider failures visible without debug transcripts or session handles.
    pipecat_logger.remove()
    pipecat_logger.add(sys.stderr, level="WARNING")
    pipecat_logger.enable("pipecat")
    scenarios = load_scenarios()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        dsn = settings.database_url.get_secret_value()
        database = await (
            PostgresDatabase.open(dsn) if dsn else Database.open(settings.database_path)
        )
        try:
            sessions = Sessions(
                database,
                scenarios,
                settings.gemini_model,
                settings.max_sessions,
                settings.session_token_ttl_seconds,
            )
            await sessions.recover()
            app.state.sessions = sessions
            app.state.settings = settings
            secret = settings.supabase_secret_key.get_secret_value()
            app.state.admin = admin or (
                SupabaseAdmin(settings.supabase_url, secret)
                if settings.supabase_url and secret
                else None
            )
            app.state.auth = auth or (
                SupabaseAuth(settings.supabase_url) if settings.supabase_url else None
            )
            key = settings.google_api_key.get_secret_value()
            app.state.feedback_writer = feedback_writer or (
                GeminiFeedbackWriter(key, settings.feedback_model) if key else None
            )
            runtime = VoiceRuntime(sessions, settings)
            app.state.runtime = runtime
            maintenance = asyncio.create_task(runtime.maintain())
            try:
                yield
            finally:
                maintenance.cancel()
                with suppress(asyncio.CancelledError):
                    await maintenance
                try:
                    await runtime.close()
                finally:
                    await sessions.close()
        finally:
            await database.close()

    app = FastAPI(
        title="Voicebot API",
        version="0.1.0",
        docs_url="/v1/docs",
        swagger_ui_oauth2_redirect_url="/v1/docs/oauth2-redirect",
        redoc_url=None,
        openapi_url="/v1/openapi.json",
        lifespan=lifespan,
        description=(
            "Create a session, authorize with its Bearer token, then connect via SmallWebRTC. "
            "RTVI carries live transcripts and bot status. Custom server-message data kinds: "
            "session.ready, transcript.final, session.ended, session.failed. "
            "Use REST events to recover state after a dropped connection. "
            "One backend process owns the local database and active peers."
        ),
        responses={
            status: {"model": ErrorResponse}
            for status in (400, 401, 403, 404, 409, 413, 415, 422, 500, 502, 503, 504)
        },
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(scenario_router(scenarios), prefix="/v1")
    app.include_router(sessions_router, prefix="/v1")
    app.include_router(documents_router, prefix="/v1")
    app.include_router(account_router, prefix="/v1")

    @app.middleware("http")
    async def no_session_cache(request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/v1/sessions"):
            response.headers["Cache-Control"] = "no-store"
        return response

    async def application_error(request: Request, error: Exception):
        status, code, detail = (
            FEEDBACK_ERRORS[error.reason]
            if isinstance(error, FeedbackFailed)
            else APPLICATION_ERRORS[type(error)]
        )
        return JSONResponse(status_code=status, content={"code": code, "detail": detail})

    async def validation_error(request: Request, error: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"code": "validation_error", "detail": jsonable_encoder(error.errors())},
        )

    async def http_error(request: Request, error: StarletteHTTPException):
        return JSONResponse(
            status_code=error.status_code,
            content={"code": "http_error", "detail": error.detail},
            headers=error.headers,
        )

    async def unexpected_error(request: Request, error: Exception):
        frames = [(frame.name, frame.lineno) for frame in traceback.extract_tb(error.__traceback__)]
        logger.error("Unhandled request error: type=%s frames=%s", type(error).__name__, frames)
        return JSONResponse(
            status_code=500, content={"code": "internal_error", "detail": "Internal server error"}
        )

    app.add_exception_handler(RequestValidationError, validation_error)
    app.add_exception_handler(StarletteHTTPException, http_error)
    app.add_exception_handler(Exception, unexpected_error)
    for error in (*APPLICATION_ERRORS, FeedbackFailed):
        app.add_exception_handler(error, application_error)

    @app.get("/v1/health", tags=["health"])
    def health() -> dict[str, str | bool]:
        return {
            "status": "ok",
            "voice_configured": bool(settings.google_api_key.get_secret_value()),
            "auth_required": bool(settings.supabase_url),
        }

    return app


def run() -> None:
    import uvicorn

    uvicorn.run("voicebot.main:create_app", factory=True, host="127.0.0.1", port=8000, workers=1)
