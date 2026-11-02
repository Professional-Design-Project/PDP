from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from voicebot.application.scenarios import Scenarios
from voicebot.domain.scenario import Language


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
    def list_scenarios(language: Language = Language.PL):
        return scenarios.list(language)

    @router.get("/{scenario_id}", response_model=ScenarioResponse)
    def get_scenario(scenario_id: str, language: Language = Language.PL):
        return scenarios.get(scenario_id, language)

    return router
