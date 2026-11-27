from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.processors.aggregators.llm_response_universal import LLMUserAggregatorParams
from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.services.openrouter.llm import OpenRouterLLMService
from pipecat.transcriptions.language import Language
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection

from voicebot.domain.session import Session
from voicebot.infrastructure.voice.conversation import PipecatConversation
from voicebot.settings import Settings


class CascadedConversation(PipecatConversation):
    def __init__(
        self, session: Session, connection: SmallWebRTCConnection, settings: Settings
    ) -> None:
        elevenlabs_key = settings.elevenlabs_api_key.get_secret_value()
        stt = ElevenLabsRealtimeSTTService(
            api_key=elevenlabs_key,
            settings=ElevenLabsRealtimeSTTService.Settings(
                model=settings.elevenlabs_stt_model, language=Language(session.language)
            ),
        )
        llm = OpenRouterLLMService(
            api_key=settings.openrouter_api_key.get_secret_value(),
            settings=OpenRouterLLMService.Settings(model=session.model),
        )
        tts = ElevenLabsTTSService(
            api_key=elevenlabs_key,
            settings=ElevenLabsTTSService.Settings(
                model=settings.elevenlabs_tts_model,
                voice=settings.elevenlabs_voice_id,
                language=Language(session.language),
            ),
        )
        super().__init__(
            session,
            connection,
            llm,
            LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
            stt=stt,
            tts=tts,
            system_message=session.instructions,
            greeting_role="user",
        )
