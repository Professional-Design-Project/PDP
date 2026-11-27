import logging

import aiohttp
import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from voicebot.application.feedback import (
    Feedback,
    FeedbackFailed,
    FeedbackFailure,
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
            logger.warning("Feedback response failed schema validation")
            raise FeedbackFailed(FeedbackFailure.INVALID_RESPONSE) from error
        except errors.APIError as error:
            logger.warning("Feedback provider request failed: status=%s", error.code)
            if error.code == 429:
                reason = FeedbackFailure.RATE_LIMITED
            elif error.code in (401, 403, 404):
                reason = FeedbackFailure.NOT_CONFIGURED
            elif error.code >= 500:
                reason = FeedbackFailure.PROVIDER_UNAVAILABLE
            else:
                reason = FeedbackFailure.REQUEST_REJECTED
            raise FeedbackFailed(reason) from error
        except (httpx.RequestError, aiohttp.ClientError, TimeoutError) as error:
            logger.warning("Feedback provider connection failed: %s", type(error).__name__)
            raise FeedbackFailed(FeedbackFailure.PROVIDER_UNAVAILABLE) from error


class OpenRouterFeedbackWriter:
    """Generate structured feedback without coupling evaluation to the voice engine."""

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self.model = model

    async def write(self, request: FeedbackRequest) -> Feedback:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": feedback_instructions(request)},
                            {"role": "user", "content": feedback_prompt(request)},
                        ],
                        "temperature": 0.4,
                        "response_format": {
                            "type": "json_schema",
                            "json_schema": {
                                "name": "feedback",
                                "strict": False,
                                "schema": Feedback.model_json_schema(),
                            },
                        },
                    },
                )
                response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return Feedback.model_validate_json(content)
        except httpx.HTTPStatusError as error:
            status = error.response.status_code
            logger.warning("Feedback provider request failed: status=%s", status)
            if status == 429:
                reason = FeedbackFailure.RATE_LIMITED
            elif status in (401, 403, 404):
                reason = FeedbackFailure.NOT_CONFIGURED
            elif status >= 500:
                reason = FeedbackFailure.PROVIDER_UNAVAILABLE
            else:
                reason = FeedbackFailure.REQUEST_REJECTED
            raise FeedbackFailed(reason) from error
        except (httpx.RequestError, TimeoutError) as error:
            logger.warning("Feedback provider connection failed: %s", type(error).__name__)
            raise FeedbackFailed(FeedbackFailure.PROVIDER_UNAVAILABLE) from error
        except (ValidationError, ValueError, TypeError, KeyError, IndexError) as error:
            logger.warning("Feedback provider returned an invalid response")
            raise FeedbackFailed(FeedbackFailure.INVALID_RESPONSE) from error
