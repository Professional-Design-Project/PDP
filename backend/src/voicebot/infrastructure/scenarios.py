from pathlib import Path

from pydantic import TypeAdapter

from voicebot.application.scenarios import Scenarios
from voicebot.domain.scenario import Scenario


def load_scenarios(directory: Path | None = None) -> Scenarios:
    directory = directory or Path(__file__).parents[1] / "scenarios"
    adapter = TypeAdapter(Scenario)
    return Scenarios(
        [
            adapter.validate_json(path.read_text(encoding="utf-8"))
            for path in directory.glob("*.json")
        ]
    )
