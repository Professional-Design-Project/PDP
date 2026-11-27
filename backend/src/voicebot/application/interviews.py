from dataclasses import dataclass
from enum import StrEnum

from voicebot.domain.session import ConversationEndReason

INTERVIEW_SCENARIOS = frozenset(
    {"job-interview", "hr-screening", "behavioral-interview", "specialist-interview"}
)
MIN_INTERVIEW_SECONDS = 300
MIN_INTERVIEW_USER_TURNS = 6
INTERVIEW_WRAP_UP_SECONDS = 720


def can_complete_interview(elapsed_seconds: float, user_turns: int) -> bool:
    return elapsed_seconds >= MIN_INTERVIEW_SECONDS and (
        user_turns >= MIN_INTERVIEW_USER_TURNS or elapsed_seconds >= INTERVIEW_WRAP_UP_SECONDS
    )


@dataclass
class ClosingConfirmation:
    prepared: bool = False
    asked_after_turn: int | None = None

    def prepare(self) -> None:
        self.prepared = True
        self.asked_after_turn = None

    def assistant_turn_finished(self, user_turns: int, *, interrupted: bool) -> None:
        self.asked_after_turn = user_turns if self.prepared and not interrupted else None
        self.prepared = False

    def has_reply(self, user_turns: int) -> bool:
        # The model interprets the reply; this policy only enforces a fresh user turn.
        return self.asked_after_turn is not None and user_turns > self.asked_after_turn


class CompletionDecision(StrEnum):
    ALLOW = "allow"
    CONTINUE_INTERVIEW = "continue_interview"
    CONFIRMATION_REQUIRED = "confirmation_required"


def completion_decision(
    *,
    reason: ConversationEndReason,
    is_interview: bool,
    elapsed_seconds: float,
    user_turns: int,
    confirmation: ClosingConfirmation,
) -> CompletionDecision:
    """Enforce application-controlled closing rules independently of the voice provider."""
    if reason == ConversationEndReason.USER_ENDED or not is_interview:
        return CompletionDecision.ALLOW
    if not can_complete_interview(elapsed_seconds, user_turns):
        return CompletionDecision.CONTINUE_INTERVIEW
    if not confirmation.has_reply(user_turns):
        return CompletionDecision.CONFIRMATION_REQUIRED
    return CompletionDecision.ALLOW
