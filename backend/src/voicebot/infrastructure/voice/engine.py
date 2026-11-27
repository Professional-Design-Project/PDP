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
