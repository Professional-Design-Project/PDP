from pipecat.processors.aggregators.llm_response_universal import LLMUserAggregatorParams
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService
from pipecat.transcriptions.language import Language
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.turns.user_turn_strategies import ExternalUserTurnStrategies

from voicebot.domain.session import Session
from voicebot.infrastructure.voice.conversation import PipecatConversation, ProviderFailed
from voicebot.infrastructure.voice.diagnostics import AudioInputDiagnostics
from voicebot.infrastructure.voice.engine import VoiceUnavailable
from voicebot.settings import Settings

__all__ = ["GeminiConversation", "ProviderFailed"]


class GeminiConversation(PipecatConversation):
    def __init__(
        self, session: Session, connection: SmallWebRTCConnection, settings: Settings
    ) -> None:
        key = settings.google_api_key.get_secret_value()
        if not key:
            raise VoiceUnavailable("Gemini API key is not configured")
        llm = GeminiLiveLLMService(
            api_key=key,
            settings=GeminiLiveLLMService.Settings(
                model=session.model,
                system_instruction=session.instructions,
                voice=settings.gemini_voice,
                language=Language(session.language),
                context_window_compression={"enabled": True},
            ),
        )
        super().__init__(
            session,
            connection,
            llm,
            LLMUserAggregatorParams(user_turn_strategies=ExternalUserTurnStrategies()),
            diagnostics=AudioInputDiagnostics(session.id, llm),
        )
