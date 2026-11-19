from dataclasses import dataclass

FOCUS_STEP = 10
MAX_LEVEL = 3
MAX_FOLLOW_UPS = 3

PRECISION = (
    "Ask broad, open questions that let the user choose how to answer. Do not ask for fine "
    "details, exact numbers or definitions.",
    "Mix broad questions with specific ones that ask for a concrete example or detail.",
    "Ask precise questions. Ask for concrete details, numbers, definitions and the reasoning "
    "behind each answer.",
)

PRESSURE = (
    "Be patient and encouraging. Let the user finish long answers and accept reasonable answers.",
    "Be neutral and matter-of-fact. Say so when an answer does not address the question.",
    "Be demanding. Politely cut long answers short, challenge weak or unsupported claims and ask "
    "the user to defend them. Never be rude.",
)


@dataclass(frozen=True)
class InterviewStyle:
    focus: int = 50
    precision: int = 2
    pressure: int = 2
    follow_ups: int = 2

    def __post_init__(self) -> None:
        if not 0 <= self.focus <= 100 or self.focus % FOCUS_STEP:
            raise ValueError("Focus must be a multiple of 10 between 0 and 100")
        if not 1 <= self.precision <= MAX_LEVEL or not 1 <= self.pressure <= MAX_LEVEL:
            raise ValueError("Precision and pressure must be between 1 and 3")
        if not 0 <= self.follow_ups <= MAX_FOLLOW_UPS:
            raise ValueError("Follow-ups must be between 0 and 3")


def focus_rule(focus: int) -> str:
    if focus == 0:
        return (
            "Ask only general questions for this kind of conversation. Do not ask about the "
            "details of the user's context or documents."
        )
    if focus == 100:
        return "Base every question on the user's context and documents."
    return (
        f"Base about {focus}% of your questions on the user's context and documents, and make "
        "the rest general questions for this kind of conversation."
    )


def follow_up_rule(follow_ups: int) -> str:
    if follow_ups == 0:
        return "Do not ask follow-up questions. Move to a new question after each answer."
    levels = (
        "Use light probing: clarify the most important gap in a vague answer, then favour "
        "breadth over depth. Do not use a fixed follow-up count.",
        "Probe adaptively: follow up on vague claims, missing personal contribution or "
        "unsupported reasoning. Usually one focused follow-up on a topic is enough; "
        "continue only for an important unresolved point or a particularly relevant detail. "
        "Do not use a fixed follow-up count. Move on when the answer is clear or further "
        "probing adds no useful evidence; "
        "do not repeat a question the candidate has already answered.",
        "Probe persistently: test concrete evidence, reasoning, alternatives and consistency "
        "with earlier answers. Use further follow-ups while they reveal something new, not "
        "a fixed count. If the candidate is stuck, rephrase or try a different angle before "
        "moving on; do not badger them or get trapped on one topic.",
    )
    return levels[follow_ups - 1]


def style_block(style: InterviewStyle) -> list[str]:
    return [
        "Interview style chosen by the user. Where it is more specific than the goals above, "
        "follow it:",
        f"- {focus_rule(style.focus)} If the user gave no context or documents, ask general "
        "questions.",
        f"- {PRECISION[style.precision - 1]}",
        f"- {PRESSURE[style.pressure - 1]}",
        f"- {follow_up_rule(style.follow_ups)}",
    ]
