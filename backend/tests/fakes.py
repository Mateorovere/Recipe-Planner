"""Fake AI providers used across the test suite.

Every test in this repo runs against these fakes — never against a real AI API —
per the project's testing requirements. They implement the same interfaces as the
real providers so services/routes can't tell the difference.
"""

from __future__ import annotations

import re

from app.ai.base import LLMProvider, NutritionProvider, SpeechProvider, VisionProvider
from app.ai.types import (
    NutritionEstimate,
    RawDetectedIngredient,
    RecipeRerankCandidate,
    RerankResult,
)


class FakeVisionProvider(VisionProvider):
    def __init__(self, ingredients: list[RawDetectedIngredient] | None = None) -> None:
        self.ingredients = ingredients or [
            RawDetectedIngredient(name="tomato", confidence=0.96),
            RawDetectedIngredient(name="egg", confidence=0.94),
            RawDetectedIngredient(name="onion", confidence=0.91),
        ]

    async def detect_ingredients(
        self, image_bytes: bytes, mime_type: str
    ) -> list[RawDetectedIngredient]:
        return self.ingredients


class FakeSpeechProvider(SpeechProvider):
    def __init__(self, transcript: str = "I have chicken, rice, onions and garlic.") -> None:
        self.transcript = transcript

    async def transcribe(self, audio_bytes: bytes, mime_type: str) -> str:
        return self.transcript


class FakeLLMProvider(LLMProvider):
    """Extracts ingredients with a naive split instead of calling a real LLM."""

    def __init__(self, ingredients: list[RawDetectedIngredient] | None = None) -> None:
        self.forced_ingredients = ingredients

    async def extract_ingredients(self, text: str) -> list[RawDetectedIngredient]:
        if self.forced_ingredients is not None:
            return self.forced_ingredients
        cleaned = re.sub(r"^i have\s*", "", text.strip().lower())
        cleaned = cleaned.rstrip(".")
        parts = re.split(r",|\band\b", cleaned)
        return [RawDetectedIngredient(name=p.strip(), confidence=0.9) for p in parts if p.strip()]

    async def rerank(
        self, candidates: list[RecipeRerankCandidate], user_ingredients: list[str]
    ) -> list[RerankResult]:
        return [
            RerankResult(
                recipe_id=c.recipe_id,
                adjusted_score=c.base_score,
                explanation=f"You have {len(c.matched_ingredients)} matching ingredients.",
            )
            for c in candidates
        ]


class FakeNutritionProvider(NutritionProvider):
    async def estimate(
        self, *, title: str, ingredients: list[str], servings: int
    ) -> NutritionEstimate:
        return NutritionEstimate(
            calories=400.0,
            protein_g=20.0,
            carbs_g=40.0,
            fat_g=15.0,
            fiber_g=5.0,
            source="ai_generated",
            notes="fake estimate for tests",
        )


class FailingLLMProvider(LLMProvider):
    """Used to test that recipe ranking degrades gracefully when AI reranking fails."""

    async def extract_ingredients(self, text: str) -> list[RawDetectedIngredient]:
        from app.core.exceptions import AIProviderError

        raise AIProviderError("simulated failure")

    async def rerank(
        self, candidates: list[RecipeRerankCandidate], user_ingredients: list[str]
    ) -> list[RerankResult]:
        from app.core.exceptions import AIProviderError

        raise AIProviderError("simulated failure")
