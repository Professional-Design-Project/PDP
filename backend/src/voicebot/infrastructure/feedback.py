import logging

from google import genai
from google.genai import types
from pydantic import ValidationError

from voicebot.application.feedback import (
    Feedback,
    FeedbackFailed,
    FeedbackRequest,
    feedback_instructions,
    feedback_prompt,
)

logger = logging.getLogger(__name__)


class GeminiFeedbackWriter:
    def __init__(self, api_key: str, model: str) -> None:
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def write(self, request: FeedbackRequest) -> Feedback:
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=feedback_prompt(request),
                config=types.GenerateContentConfig(
                    system_instruction=feedback_instructions(request),
                    response_mime_type="application/json",
                    response_json_schema=Feedback.model_json_schema(),
                    temperature=0.4,
                ),
            )
            return Feedback.model_validate_json(response.text or "")
        except ValidationError as error:
            logger.error("Feedback response was not valid")
            raise FeedbackFailed from error
        except Exception as error:
            logger.error("Feedback request failed: %s", type(error).__name__)
            raise FeedbackFailed from error
