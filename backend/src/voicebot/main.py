from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from voicebot.api.scenarios import scenario_router
from voicebot.api.sessions import router as sessions_router
from voicebot.application.scenarios import ScenarioNotFound
from voicebot.application.sessions import SessionAccessDenied, SessionNotFound, Sessions
from voicebot.domain.session import SessionConflict
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.settings import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    scenarios = load_scenarios()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database = await Database.open(settings.database_path)
        try:
            sessions = Sessions(database, scenarios, settings.gemini_model)
            await sessions.recover()
            app.state.sessions = sessions
            yield
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
        }
        status, detail = errors[type(error)]
        return JSONResponse(status_code=status, content={"detail": detail})

    for error in (ScenarioNotFound, SessionNotFound, SessionAccessDenied, SessionConflict):
        app.add_exception_handler(error, application_error)

    @app.get("/v1/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
