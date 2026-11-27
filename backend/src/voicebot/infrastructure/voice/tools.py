from pipecat.adapters.llm.schemas.function_schema import FunctionSchema

from voicebot.domain.session import ConversationEndReason


def conversation_tools(*, is_interview: bool) -> list[FunctionSchema]:
    """Describe the application-controlled tools exposed to a Pipecat LLM service."""
    tools = [
        FunctionSchema(
            name="finish_session",
            description="Request the end of the meeting BEFORE saying goodbye. "
            "For interviews, scenario_completed requires prepare_closing, "
            "a spoken invitation for final questions, and a new, complete "
            "candidate reply clearly confirming they have no more questions. "
            "A fragment, pause or another question is not confirmation. "
            "Use user_ended only for an explicit request to stop, not an "
            "answer to an interview question or a workaround for rejection. "
            "After the tool succeeds, say one brief closing statement, "
            "then remain silent.",
            properties={
                "reason": {
                    "type": "string",
                    "enum": [reason.value for reason in ConversationEndReason],
                }
            },
            required=["reason"],
        )
    ]
    if is_interview:
        tools.append(
            FunctionSchema(
                name="prepare_closing",
                description="Before inviting the candidate's final questions, "
                "prepare to close the interview. This does NOT end it. "
                "After success, ask one closing question and yield the turn. "
                "Use again before a renewed invitation after answering "
                "candidate questions. Never combine with finish_session "
                "in the same turn.",
                properties={},
                required=[],
            )
        )
    return tools
