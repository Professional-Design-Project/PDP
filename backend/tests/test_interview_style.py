import pytest

from voicebot.application.interview_style import InterviewStyle, style_block
from voicebot.application.scenarios import compile_instructions
from voicebot.domain.scenario import Language
from voicebot.infrastructure.scenarios import load_scenarios


def test_default_style_is_balanced():
    rules = "\n".join(style_block(InterviewStyle()))
    assert "about 50% of your questions" in rules
    assert "Mix broad questions" in rules
    assert "neutral and matter-of-fact" in rules
    assert "Probe adaptively" in rules
    assert "Do not use a fixed follow-up count" in rules


def test_chosen_style_reaches_the_instructions():
    scenario = load_scenarios().get("thesis-defence", Language.EN)
    style = InterviewStyle(focus=100, precision=3, pressure=3, follow_ups=0)
    instructions = compile_instructions(scenario, "Thesis about particle filters.", style=style)
    assert "Base every question on the user's context and documents." in instructions
    assert "Ask precise questions." in instructions
    assert "Be demanding." in instructions
    assert "Never be rude." in instructions
    assert "Do not ask follow-up questions." in instructions
    assert instructions.index("Interview style") > instructions.index("Constraints:")


def test_extreme_values_have_their_own_wording():
    gentle = "\n".join(style_block(InterviewStyle(focus=0, precision=1, pressure=1, follow_ups=1)))
    assert "Ask only general questions" in gentle
    assert "broad, open questions" in gentle
    assert "patient and encouraging" in gentle
    assert "Use light probing" in gentle


@pytest.mark.parametrize(
    "values",
    [
        {"focus": 55},
        {"focus": 110},
        {"precision": 0},
        {"pressure": 4},
        {"follow_ups": 4},
    ],
)
def test_out_of_range_style_is_rejected(values):
    with pytest.raises(ValueError):
        InterviewStyle(**values)
