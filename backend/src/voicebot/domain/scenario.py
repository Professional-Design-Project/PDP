from dataclasses import dataclass
from enum import StrEnum


class Language(StrEnum):
    PL = "pl"
    EN = "en"

    @property
    def prompt_name(self) -> str:
        return {Language.PL: "Polish", Language.EN: "English"}[self]


@dataclass(frozen=True)
class Scenario:
    id: str
    version: int
    title: str
    description: str
    role: str
    situation: str
    goals: tuple[str, ...]
    constraints: tuple[str, ...]
    language: Language

    def __post_init__(self) -> None:
        if self.version < 1:
            raise ValueError("Scenario version must be positive")
        for value in (
            self.id,
            self.title,
            self.description,
            self.role,
            self.situation,
        ):
            if not value.strip():
                raise ValueError("Scenario fields cannot be blank")
        if not self.goals or not self.constraints:
            raise ValueError("Scenario needs goals and constraints")
        if any(not value.strip() for value in (*self.goals, *self.constraints)):
            raise ValueError("Scenario rules cannot be blank")
