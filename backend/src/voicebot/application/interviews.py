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
