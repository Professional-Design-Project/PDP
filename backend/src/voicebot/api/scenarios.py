from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from voicebot.application.scenarios import Scenarios


class ScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    version: int
    title: str
    description: str
    language: str


def scenario_router(scenarios: Scenarios) -> APIRouter:
    router = APIRouter(prefix="/scenarios", tags=["scenarios"])

    @router.get("", response_model=list[ScenarioResponse])
    def list_scenarios():
        return scenarios.list()

    @router.get("/{scenario_id}", response_model=ScenarioResponse)
    def get_scenario(scenario_id: str):
        return scenarios.get(scenario_id)

    return router
