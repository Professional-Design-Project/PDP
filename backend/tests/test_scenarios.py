from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from voicebot.application.scenarios import compile_instructions
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.main import create_app
from voicebot.settings import Settings


def test_scenario_rules_are_validated_and_compiled():
    scenario = load_scenarios().get("salary-negotiation")
    instructions = compile_instructions(scenario)
    assert "version: 1" in instructions
    assert all(rule in instructions for rule in scenario.constraints)
    with pytest.raises(ValueError):
        replace(scenario, version=0)
    with pytest.raises(ValueError):
        replace(scenario, constraints=())


def test_public_scenario_does_not_expose_private_rules():
    with TestClient(create_app(Settings(_env_file=None))) as client:
        scenarios = client.get("/v1/scenarios").json()
        assert len(scenarios) == 1
        response = client.get("/v1/scenarios/salary-negotiation")
        assert response.status_code == 200
        assert "constraints" not in response.json()
        assert "role" not in response.json()
        assert client.get("/v1/scenarios/missing").status_code == 404
