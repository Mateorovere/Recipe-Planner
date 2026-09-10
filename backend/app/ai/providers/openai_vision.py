from __future__ import annotations

import base64

from app.ai.base import VisionProvider
from app.ai.providers._openai_client import build_client, chat_json
from app.ai.types import RawDetectedIngredient
from app.core.exceptions import AIProviderError

_SYSTEM_PROMPT = (
    "You are a culinary vision assistant. Identify every distinct food ingredient "
    "visible in the photo. Ignore packaging, utensils, and non-food items. "
    "Respond ONLY with JSON of the shape "
    '{"ingredients": [{"name": "tomato", "confidence": 0.96}, ...]}. '
    "`name` must be a singular, lowercase, common ingredient name. "
    "`confidence` is your own calibrated estimate between 0 and 1 of how certain you "
    "are that ingredient is actually present. If you cannot identify any food, "
    'return {"ingredients": []}.'
)


class OpenAIVisionProvider(VisionProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = build_client(api_key)
        self._model = model

    async def detect_ingredients(
        self, image_bytes: bytes, mime_type: str
    ) -> list[RawDetectedIngredient]:
        b64_image = base64.b64encode(image_bytes).decode("ascii")
        data_url = f"data:{mime_type};base64,{b64_image}"

        result = await chat_json(
            self._client,
            model=self._model,
            system_prompt=_SYSTEM_PROMPT,
            user_content=[
                {"type": "text", "text": "Identify the ingredients in this image."},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        )

        raw_items = result.get("ingredients", [])
        if not isinstance(raw_items, list):
            raise AIProviderError("The AI provider returned an unexpected ingredients shape.")

        detected: list[RawDetectedIngredient] = []
        for item in raw_items:
            name = str(item.get("name", "")).strip().lower()
            if not name:
                continue
            confidence = item.get("confidence")
            detected.append(
                RawDetectedIngredient(
                    name=name,
                    confidence=float(confidence) if confidence is not None else None,
                )
            )
        return detected
