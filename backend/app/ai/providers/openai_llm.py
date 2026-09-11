from __future__ import annotations

from app.ai.base import LLMProvider
from app.ai.providers._openai_client import build_client, chat_json
from app.ai.types import RawDetectedIngredient
from app.core.exceptions import AIProviderError

_EXTRACT_SYSTEM_PROMPT = (
    "You extract food ingredients mentioned in a user's free-form text (which may be "
    "a speech transcript). Respond ONLY with JSON of the shape "
    '{"ingredients": [{"name": "chicken breast", "confidence": 0.95, "quantity": 2, '
    '"unit": "breast"}, ...]}. `name` must be a singular, lowercase, common '
    'ingredient name (normalize plurals and brand names, e.g. "chicken breasts" -> '
    '"chicken breast"). `confidence` is your own estimate of how clearly that '
    "ingredient was mentioned. `quantity` and `unit` are best-effort: if an amount "
    'was mentioned (e.g. "2 eggs", "500g chicken", "a cup of rice") extract it as a '
    "number + unit string; otherwise use null for both - never guess a quantity that "
    'wasn\'t stated. If no food ingredients are mentioned, return {"ingredients": []}.'
)


class OpenAILLMProvider(LLMProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = build_client(api_key)
        self._model = model

    async def extract_ingredients(self, text: str) -> list[RawDetectedIngredient]:
        result = await chat_json(
            self._client,
            model=self._model,
            system_prompt=_EXTRACT_SYSTEM_PROMPT,
            user_content=text,
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
            quantity = item.get("quantity")
            unit = item.get("unit")
            detected.append(
                RawDetectedIngredient(
                    name=name,
                    confidence=float(confidence) if confidence is not None else None,
                    quantity=float(quantity) if quantity is not None else None,
                    unit=str(unit) if unit else None,
                )
            )
        return detected
