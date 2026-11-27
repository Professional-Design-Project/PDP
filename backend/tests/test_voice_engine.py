from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic import ValidationError

from voicebot.infrastructure.voice.engine import (
    CascadedVoiceEngine,
    GeminiVoiceEngine,
    VoiceUnavailable,
    select_voice_engine,
)
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
        {"voice_architecture": "unknown"},
        {"realtime_provider": "unknown"},
        {"stt_provider": "unknown"},
        {"llm_provider": "unknown"},
        {"tts_provider": "unknown"},
    ],
)
def test_unsupported_configuration_fails_without_fallback(values):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values)


def test_cascaded_engine_requires_only_selected_credentials():
    settings = Settings(
        _env_file=None,
        voice_architecture="cascaded",
        google_api_key="",
        openrouter_api_key="fake-router-key",
        elevenlabs_api_key="fake-voice-key",
        elevenlabs_voice_id="fake-voice",
    )
    engine = select_voice_engine(settings)
    assert isinstance(engine, CascadedVoiceEngine)
    assert engine.configured
    assert engine.model == settings.openrouter_voice_model


def test_cascaded_engine_rejects_missing_credentials_before_creating_services():
    settings = Settings(_env_file=None, voice_architecture="cascaded")
    engine = select_voice_engine(settings)
    assert not engine.configured
    with pytest.raises(VoiceUnavailable, match="VOICEBOT_OPENROUTER_API_KEY"):
        engine.create(None, None)


async def test_cascaded_engine_composes_real_pipecat_services_without_network():
    from pipecat.frames.frames import STTMuteFrame
    from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService
    from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
    from pipecat.services.openrouter.llm import OpenRouterLLMService

    settings = Settings(
        _env_file=None,
        voice_architecture="cascaded",
        openrouter_api_key="fake-router-key",
        elevenlabs_api_key="fake-voice-key",
        elevenlabs_voice_id="fake-voice",
    )
    session = SimpleNamespace(
        id="test",
        scenario_id="oral-exam",
        language="en",
        model=settings.openrouter_voice_model,
        instructions="Keep the examiner role.",
    )
    conversation = select_voice_engine(settings).create(session, Mock())
    assert isinstance(conversation.stt, ElevenLabsRealtimeSTTService)
    assert isinstance(conversation.llm, OpenRouterLLMService)
    assert isinstance(conversation.tts, ElevenLabsTTSService)
    conversation.stt.queue_frame = AsyncMock()
    conversation.llm.push_frame = AsyncMock()
    result = AsyncMock()
    await conversation._finish_session(
        SimpleNamespace(arguments={"reason": "user_ended"}, result_callback=result)
    )
    assert isinstance(conversation.stt.queue_frame.call_args.args[0], STTMuteFrame)
    assert conversation.stt.queue_frame.call_args.args[0].mute
    assert result.call_args.args[0]["status"] == "closing"
