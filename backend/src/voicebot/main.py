import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger as pipecat_logger

from voicebot.api.scenarios import scenario_router
from voicebot.api.sessions import router as sessions_router
from voicebot.application.scenarios import ScenarioNotFound
from voicebot.application.sessions import (
    SessionAccessDenied,
    SessionLimitExceeded,
    SessionNotFound,
    Sessions,
)
from voicebot.domain.session import SessionConflict
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.infrastructure.voice.gemini import VoiceUnavailable
from voicebot.infrastructure.voice.runtime import InvalidSignaling, VoiceRuntime
from voicebot.settings import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    logging.basicConfig(level=logging.INFO)
    # Pipecat debug output can contain transcripts and provider session handles.
    pipecat_logger.disable("pipecat")
    scenarios = load_scenarios()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database = await Database.open(settings.database_path)
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
            runtime = VoiceRuntime(sessions, settings)
            app.state.runtime = runtime
            maintenance = asyncio.create_task(runtime.maintain())
            try:
                yield
            finally:
                maintenance.cancel()
                with suppress(asyncio.CancelledError):
                    await maintenance
                await runtime.close()
        finally:
            await database.close()

    app = FastAPI(
        title="Voicebot API",
        version="0.1.0",
        docs_url="/v1/docs",
        redoc_url=None,
        openapi_url="/v1/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(scenario_router(scenarios), prefix="/v1")
    app.include_router(sessions_router, prefix="/v1")

    async def application_error(request: Request, error: Exception):
        errors = {
            ScenarioNotFound: (404, "Scenario not found"),
            SessionNotFound: (404, "Session not found"),
            SessionAccessDenied: (403, "Session access denied"),
            SessionConflict: (409, "Session state conflict"),
            InvalidSignaling: (400, "Invalid WebRTC signaling"),
            VoiceUnavailable: (503, "Voice provider is not configured"),
            SessionLimitExceeded: (503, "Session capacity reached"),
            TimeoutError: (504, "Voice connection timed out"),
        }
        status, detail = errors[type(error)]
        return JSONResponse(status_code=status, content={"detail": detail})

    for error in (
        ScenarioNotFound,
        SessionNotFound,
        SessionAccessDenied,
        SessionConflict,
        InvalidSignaling,
        VoiceUnavailable,
        SessionLimitExceeded,
        TimeoutError,
    ):
        app.add_exception_handler(error, application_error)

    @app.get("/v1/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
