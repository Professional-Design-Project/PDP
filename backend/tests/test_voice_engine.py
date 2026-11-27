import pytest
from pydantic import ValidationError

from voicebot.infrastructure.voice.engine import GeminiVoiceEngine, select_voice_engine
from voicebot.settings import Settings


def test_default_configuration_selects_gemini_without_connecting():
    settings = Settings(_env_file=None, google_api_key="")
    engine = select_voice_engine(settings)

    assert isinstance(engine, GeminiVoiceEngine)
    assert engine.profile == "gemini_live"
    assert engine.model == settings.gemini_model
    assert not engine.configured


@pytest.mark.parametrize(
    "values",
    [
        {"voice_architecture": "cascaded"},
        {"voice_architecture": "unknown"},
        {"realtime_provider": "unknown"},
    ],
)
def test_unsupported_configuration_fails_without_fallback(values):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values)
