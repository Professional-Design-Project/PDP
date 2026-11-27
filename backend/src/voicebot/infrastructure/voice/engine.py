import asyncio
from collections.abc import Awaitable, Callable
from typing import Protocol

from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection

from voicebot.domain.session import ConversationEndReason, Session, Speaker
from voicebot.settings import Settings


class VoiceUnavailable(Exception):
    """The configured voice engine cannot start a session."""


class Conversation(Protocol):
    async def run(
        self,
        stop: asyncio.Event,
        on_ready: Callable[[], Awaitable[None]],
        on_transcript: Callable[[Speaker, str, bool, str], Awaitable[None]],
        on_completed: Callable[[ConversationEndReason, bytes], Awaitable[None]],
    ) -> None: ...


class VoiceEngine(Protocol):
    profile: str
    model: str

    @property
    def configured(self) -> bool: ...

    def create(self, session: Session, connection: SmallWebRTCConnection) -> Conversation: ...


class GeminiVoiceEngine:
    profile = "gemini_live"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model = settings.gemini_model

    @property
    def configured(self) -> bool:
        return bool(self.settings.google_api_key.get_secret_value())

    def create(self, session: Session, connection: SmallWebRTCConnection) -> Conversation:
        if not self.configured:
            raise VoiceUnavailable("Set VOICEBOT_GOOGLE_API_KEY to use Gemini Live")
        from voicebot.infrastructure.voice.gemini import GeminiConversation

        return GeminiConversation(session, connection, self.settings)


class CascadedVoiceEngine:
    profile = "cascaded"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model = settings.openrouter_voice_model

    @property
    def configured(self) -> bool:
        return all(
            (
                self.settings.openrouter_api_key.get_secret_value(),
                self.settings.elevenlabs_api_key.get_secret_value(),
                self.settings.elevenlabs_voice_id.strip(),
                self.model.strip(),
                self.settings.elevenlabs_stt_model.strip(),
                self.settings.elevenlabs_tts_model.strip(),
            )
        )

    def create(self, session: Session, connection: SmallWebRTCConnection) -> Conversation:
        if not self.configured:
            raise VoiceUnavailable(
                "Set VOICEBOT_OPENROUTER_API_KEY, VOICEBOT_ELEVENLABS_API_KEY, "
                "VOICEBOT_ELEVENLABS_VOICE_ID and nonempty voice model settings"
            )
        from voicebot.infrastructure.voice.cascaded import CascadedConversation

        return CascadedConversation(session, connection, self.settings)


def select_voice_engine(settings: Settings) -> VoiceEngine:
    """Compose the selected engine without opening provider connections."""
    if settings.voice_architecture == "realtime" and settings.realtime_provider == "gemini":
        return GeminiVoiceEngine(settings)
    if settings.voice_architecture == "cascaded":
        return CascadedVoiceEngine(settings)
    raise ValueError("Unsupported voice architecture or realtime provider")
