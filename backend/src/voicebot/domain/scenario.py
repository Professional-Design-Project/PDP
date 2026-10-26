from dataclasses import dataclass


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
    language: str

    def __post_init__(self) -> None:
        if self.version < 1:
            raise ValueError("Scenario version must be positive")
        for value in (
            self.id,
            self.title,
            self.description,
            self.role,
            self.situation,
            self.language,
        ):
            if not value.strip():
                raise ValueError("Scenario fields cannot be blank")
        if not self.goals or not self.constraints:
            raise ValueError("Scenario needs goals and constraints")
        if any(not value.strip() for value in (*self.goals, *self.constraints)):
            raise ValueError("Scenario rules cannot be blank")
