from __future__ import annotations

import json

from app.ai.base import NutritionProvider
from app.ai.providers._openai_client import build_client, chat_json
from app.ai.types import NutritionEstimate
from app.core.exceptions import AIProviderError

_SYSTEM_PROMPT = (
    "You are a nutrition estimation assistant. Given a recipe title, its ingredient "
    "list, and the number of servings, estimate the PER-SERVING nutrition facts. "
    "These are rough estimates, not a lab analysis. Respond ONLY with JSON of the "
    'shape {"calories": 420, "protein_g": 28, "carbs_g": 35, "fat_g": 18, '
    '"fiber_g": 4, "notes": "short caveat, e.g. varies with oil used"}. '
    "All numeric fields are per serving and must be non-negative numbers."
)


class OpenAINutritionProvider(NutritionProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = build_client(api_key)
        self._model = model

    async def estimate(
        self, *, title: str, ingredients: list[str], servings: int
    ) -> NutritionEstimate:
        payload = {"title": title, "ingredients": ingredients, "servings": servings}
        result = await chat_json(
            self._client,
            model=self._model,
            system_prompt=_SYSTEM_PROMPT,
            user_content=json.dumps(payload),
        )
        try:
            return NutritionEstimate(
                calories=max(0.0, float(result["calories"])),
                protein_g=max(0.0, float(result["protein_g"])),
                carbs_g=max(0.0, float(result["carbs_g"])),
                fat_g=max(0.0, float(result["fat_g"])),
                fiber_g=max(0.0, float(result["fiber_g"])),
                source="ai_generated",
                notes=str(result.get("notes", "")),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise AIProviderError(
                "The AI provider returned a malformed nutrition estimate."
            ) from exc
