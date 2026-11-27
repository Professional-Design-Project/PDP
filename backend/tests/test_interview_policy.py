import pytest

from voicebot.application.interviews import (
    ClosingConfirmation,
    CompletionDecision,
    completion_decision,
)
from voicebot.domain.session import ConversationEndReason


@pytest.mark.parametrize(
    ("reason", "interview", "elapsed", "turns", "expected"),
    [
        ("user_ended", True, 0, 0, CompletionDecision.ALLOW),
        ("scenario_completed", False, 0, 0, CompletionDecision.ALLOW),
        ("scenario_completed", True, 299, 6, CompletionDecision.CONTINUE_INTERVIEW),
        ("scenario_completed", True, 300, 5, CompletionDecision.CONTINUE_INTERVIEW),
        ("scenario_completed", True, 300, 6, CompletionDecision.CONFIRMATION_REQUIRED),
        ("scenario_completed", True, 720, 0, CompletionDecision.CONFIRMATION_REQUIRED),
    ],
)
def test_completion_policy(reason, interview, elapsed, turns, expected):
    assert (
        completion_decision(
            reason=ConversationEndReason(reason),
            is_interview=interview,
            elapsed_seconds=elapsed,
            user_turns=turns,
            confirmation=ClosingConfirmation(),
        )
        == expected
    )


def test_completion_requires_a_new_reply_after_uninterrupted_invitation():
    confirmation = ClosingConfirmation()
    confirmation.prepare()
    confirmation.assistant_turn_finished(6, interrupted=False)

    def decision(turns):
        return completion_decision(
            reason=ConversationEndReason.SCENARIO_COMPLETED,
            is_interview=True,
            elapsed_seconds=300,
            user_turns=turns,
            confirmation=confirmation,
        )

    assert decision(6) == CompletionDecision.CONFIRMATION_REQUIRED
    assert decision(7) == CompletionDecision.ALLOW
    confirmation.prepare()
    confirmation.assistant_turn_finished(7, interrupted=True)
    assert decision(8) == CompletionDecision.CONFIRMATION_REQUIRED
