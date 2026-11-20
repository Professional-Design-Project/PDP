import logging
from array import array

from pipecat.frames.frames import (
    FunctionCallInProgressFrame,
    InputAudioRawFrame,
    TranscriptionFrame,
)
from pipecat.observers.base_observer import BaseObserver, FramePushed
from pipecat.processors.frame_processor import FrameDirection
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService

logger = logging.getLogger(__name__)


class AudioInputDiagnostics(BaseObserver):
    def __init__(self, session_id: str, llm: GeminiLiveLLMService) -> None:
        super().__init__()
        self._session_id = session_id
        self._llm = llm
        self._received = 0
        self._processed = 0
        self._transcriptions = 0
        self._peak = 0

    async def on_push_frame(self, data: FramePushed) -> None:
        if isinstance(data.frame, InputAudioRawFrame):
            if data.direction != FrameDirection.DOWNSTREAM:
                return
            if data.destination is self._llm:
                self._received += 1
                samples = array("h", data.frame.audio)
                self._peak = max(self._peak, max(samples, default=0), -min(samples, default=0))
                if self._received == 1:
                    logger.info(
                        "Voice input reached Gemini: session=%s rate=%s channels=%s",
                        self._session_id,
                        data.frame.sample_rate,
                        data.frame.num_channels,
                    )
            elif data.source is self._llm:
                self._processed += 1
                if self._processed % 500 == 0:
                    self.report()
        elif isinstance(data.frame, TranscriptionFrame) and data.source is self._llm:
            self._transcriptions += 1
            if self._transcriptions == 1:
                logger.info("Voice input transcription received: session=%s", self._session_id)
        elif (
            isinstance(data.frame, FunctionCallInProgressFrame)
            and data.first_push
            and data.direction == FrameDirection.DOWNSTREAM
        ):
            logger.info(
                "Voice tool started: session=%s tool=%s",
                self._session_id,
                data.frame.function_name,
            )

    def report(self) -> None:
        logger.info(
            "Voice input diagnostics: session=%s received=%s processed=%s peak=%s transcripts=%s "
            "provider_ready=%s input_paused=%s disconnecting=%s provider_session=%s local_vad=%s",
            self._session_id,
            self._received,
            self._processed,
            self._peak,
            self._transcriptions,
            self._llm._ready_for_realtime_input,
            self._llm._audio_input_paused,
            self._llm._disconnecting,
            self._llm._session is not None,
            self._llm._vad_disabled,
        )
