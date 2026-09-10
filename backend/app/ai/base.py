"""Abstract interfaces for every AI capability the app needs.

Services depend only on these ABCs (injected via `app.ai.factory`), never on a
concrete provider. Swapping OpenAI for another vendor, or local Whisper for a cloud
STT API, means writing one new class here and flipping an env var — nothing in
`services/` or `api/` changes.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.ai.types import (
    NutritionEstimate,
    RawDetectedIngredient,
    RecipeRerankCandidate,
    RerankResult,
)


class VisionProvider(ABC):
    """Image -> candidate ingredients."""

    @abstractmethod
    async def detect_ingredients(
        self, image_bytes: bytes, mime_type: str
    ) -> list[RawDetectedIngredient]: ...


class SpeechProvider(ABC):
    """Audio -> transcript text."""

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, mime_type: str) -> str: ...


class LLMProvider(ABC):
    """Free text -> candidate ingredients, plus recipe reranking/explanations."""

    @abstractmethod
    async def extract_ingredients(self, text: str) -> list[RawDetectedIngredient]: ...

    @abstractmethod
    async def rerank(
        self, candidates: list[RecipeRerankCandidate], user_ingredients: list[str]
    ) -> list[RerankResult]: ...


class NutritionProvider(ABC):
    """Recipe -> estimated nutrition facts (always labeled with its source)."""

    @abstractmethod
    async def estimate(
        self, *, title: str, ingredients: list[str], servings: int
    ) -> NutritionEstimate: ...
