import asyncio
import io
import wave
from dataclasses import dataclass

from pipecat.frames.frames import (
    DataFrame,
    Frame,
    InterruptionFrame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    OutputAudioRawFrame,
    TTSStoppedFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from voicebot.domain.session import ConversationEndReason


@dataclass
class ConversationEndFrame(DataFrame):
    reason: ConversationEndReason


@dataclass
class BeginClosingFrame(DataFrame):
    reason: ConversationEndReason


class ClosingAudio(FrameProcessor):
    """Keep only the final response as a finite WAV clip for confirmed playback."""

    def __init__(self):
        super().__init__()
        self.wav = b""
        self._reason: ConversationEndReason | None = None
        self._recording = False
        self._response_ended = False
        self._audio_ended = False
        self._pcm = bytearray()
        self._format: tuple[int, int] | None = None

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if direction == FrameDirection.DOWNSTREAM:
            if isinstance(frame, BeginClosingFrame):
                self._reason = frame.reason
            elif isinstance(frame, LLMFullResponseStartFrame) and self._reason is not None:
                self._recording = True
            elif isinstance(frame, OutputAudioRawFrame) and self._recording:
                audio_format = (frame.sample_rate, frame.num_channels)
                if (
                    not 8000 <= frame.sample_rate <= 48000
                    or frame.num_channels not in (1, 2)
                    or self._format not in (None, audio_format)
                    or len(self._pcm) + len(frame.audio)
                    > frame.sample_rate * frame.num_channels * 2 * 30
                ):
                    await self.push_error(
                        "Invalid or oversized closing audio", force_treat_as_permanent=True
                    )
                    return
                self._format = audio_format
                self._pcm.extend(frame.audio)
                return
            elif self._recording and isinstance(frame, (LLMFullResponseEndFrame, TTSStoppedFrame)):
                self._response_ended |= isinstance(frame, LLMFullResponseEndFrame)
                self._audio_ended |= isinstance(frame, TTSStoppedFrame)
                await self.push_frame(frame, direction)
                if not (self._response_ended and self._audio_ended):
                    return
                if not self._pcm or self._format is None:
                    await self.push_error("Missing closing audio", force_treat_as_permanent=True)
                    return
                buffer = io.BytesIO()
                with wave.open(buffer, "wb") as audio:
                    audio.setframerate(self._format[0])
                    audio.setnchannels(self._format[1])
                    audio.setsampwidth(2)
                    audio.writeframes(self._pcm)
                self.wav = buffer.getvalue()
                self._pcm.clear()
                self._recording = False
                await self.push_frame(ConversationEndFrame(self._reason))
                return
        await self.push_frame(frame, direction)


@dataclass
class AssistantTranscriptSavedFrame(DataFrame):
    pass


class ConversationCompletion(FrameProcessor):
    """Observe completion after the audio output and transcript aggregator."""

    def __init__(self):
        super().__init__()
        self.completed = asyncio.Event()
        self.reason: ConversationEndReason | None = None
        self._responding = False
        self._turns_started = 0
        self._turns_saved = 0

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        await self.push_frame(frame, direction)
        if direction != FrameDirection.DOWNSTREAM:
            return
        if isinstance(frame, LLMFullResponseStartFrame):
            self._turns_started += 1
            self._responding = True
        elif isinstance(frame, (LLMFullResponseEndFrame, InterruptionFrame)):
            self._responding = False
        elif isinstance(frame, ConversationEndFrame) and self.reason is None:
            self.reason = frame.reason
        elif isinstance(frame, AssistantTranscriptSavedFrame):
            self._turns_saved += 1
        if (
            self.reason is not None
            and not self._responding
            and self._turns_saved >= self._turns_started
        ):
            self.completed.set()
