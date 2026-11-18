import asyncio
from dataclasses import dataclass

from pipecat.frames.frames import (
    DataFrame,
    Frame,
    InterruptionFrame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from voicebot.domain.session import ConversationEndReason


@dataclass
class ConversationEndFrame(DataFrame):
    reason: ConversationEndReason


@dataclass
class AssistantTranscriptSavedFrame(DataFrame):
    pass


class ConversationCompletion(FrameProcessor):
    """Observe completion after the audio output and transcript aggregator."""

    # shortcut: output drain confirms transmission; add client ACKs for verified playback.

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
