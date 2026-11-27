from voicebot.domain.session import ConversationEndReason
from voicebot.infrastructure.voice.tools import conversation_tools


def test_finish_tool_has_only_the_supported_reasons():
    tools = conversation_tools(is_interview=False)
    assert [tool.name for tool in tools] == ["finish_session"]
    assert tools[0].required == ["reason"]
    assert tools[0].properties["reason"]["enum"] == [
        reason.value for reason in ConversationEndReason
    ]


def test_interview_also_exposes_argument_free_closing_preparation():
    tools = conversation_tools(is_interview=True)
    assert [tool.name for tool in tools] == ["finish_session", "prepare_closing"]
    assert tools[1].properties == {}
    assert tools[1].required == []
