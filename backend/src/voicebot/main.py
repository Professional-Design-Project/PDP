from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from voicebot.api.scenarios import scenario_router
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.settings import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    app = FastAPI(
        title="Voicebot API",
        version="0.1.0",
        docs_url="/v1/docs",
        redoc_url=None,
        openapi_url="/v1/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(scenario_router(load_scenarios()), prefix="/v1")

    @app.get("/v1/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
