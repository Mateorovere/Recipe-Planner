from __future__ import annotations

import json

from app.ai.base import LLMProvider
from app.ai.providers._openai_client import build_client, chat_json
from app.ai.types import RawDetectedIngredient, RecipeRerankCandidate, RerankResult
from app.core.exceptions import AIProviderError

_EXTRACT_SYSTEM_PROMPT = (
    "You extract food ingredients mentioned in a user's free-form text (which may be "
    "a speech transcript). Respond ONLY with JSON of the shape "
    '{"ingredients": [{"name": "chicken breast", "confidence": 0.95}, ...]}. '
    "`name` must be a singular, lowercase, common ingredient name (normalize plurals "
    'and brand names, e.g. "chicken breasts" -> "chicken breast"). `confidence` is '
    "your own estimate of how clearly that ingredient was mentioned. If no food "
    'ingredients are mentioned, return {"ingredients": []}.'
)

_RERANK_SYSTEM_PROMPT = (
    "You are a helpful cooking assistant improving a recipe recommendation ranking. "
    "You will receive a list of candidate recipes with an algorithmic base_score, "
    "the ingredients the user already has that match, and the ones they're missing. "
    "Slightly adjust ordering only when it clearly improves relevance (e.g. a recipe "
    "missing only a garnish is better than one missing a main protein even with the "
    "same match count), and write one short, friendly sentence per recipe explaining "
    "why it's a good match for THIS user's ingredients. "
    "Respond ONLY with JSON of the shape "
    '{"results": [{"recipe_id": 1, "adjusted_score": 0.87, "explanation": "..."}]}. '
    "Include every recipe_id you were given exactly once. Keep adjusted_score in the "
    "same 0-1 range as base_score."
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
            detected.append(
                RawDetectedIngredient(
                    name=name,
                    confidence=float(confidence) if confidence is not None else None,
                )
            )
        return detected

    async def rerank(
        self, candidates: list[RecipeRerankCandidate], user_ingredients: list[str]
    ) -> list[RerankResult]:
        if not candidates:
            return []

        payload = {
            "user_ingredients": user_ingredients,
            "candidates": [
                {
                    "recipe_id": c.recipe_id,
                    "title": c.title,
                    "matched_ingredients": c.matched_ingredients,
                    "missing_ingredients": c.missing_ingredients,
                    "base_score": c.base_score,
                }
                for c in candidates
            ],
        }
        result = await chat_json(
            self._client,
            model=self._model,
            system_prompt=_RERANK_SYSTEM_PROMPT,
            user_content=json.dumps(payload),
            max_tokens=1500,
        )
        raw_results = result.get("results", [])
        if not isinstance(raw_results, list):
            raise AIProviderError("The AI provider returned an unexpected rerank shape.")

        reranked: list[RerankResult] = []
        for item in raw_results:
            try:
                reranked.append(
                    RerankResult(
                        recipe_id=int(item["recipe_id"]),
                        adjusted_score=float(item["adjusted_score"]),
                        explanation=str(item["explanation"]),
                    )
                )
            except (KeyError, TypeError, ValueError) as exc:
                raise AIProviderError("The AI provider returned a malformed rerank item.") from exc
        return reranked
