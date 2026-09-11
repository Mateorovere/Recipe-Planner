"""Abstract interfaces for every AI capability the app needs.

Services depend only on these ABCs (injected via `app.ai.factory`), never on a
concrete provider. Swapping OpenAI for another vendor, or local Whisper for a cloud
STT API, means writing one new class here and flipping an env var — nothing in
`services/` or `api/` changes.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.ai.types import (
    GeneratedRecipe,
    GenerationFilters,
    IngredientQuantity,
    RawDetectedIngredient,
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
    """Free text -> candidate ingredients."""

    @abstractmethod
    async def extract_ingredients(self, text: str) -> list[RawDetectedIngredient]: ...


class RecipeGenerationProvider(ABC):
    """Ingredients (+ quantities) -> freshly generated, complete recipes.

    Recipes are generated directly from what the user has on hand — no database
    lookup. Each returned recipe already includes its nutrition estimate and a
    short explanation of why it fits the given ingredients, in a single call.
    """

    @abstractmethod
    async def generate_recipes(
        self,
        ingredients: list[IngredientQuantity],
        *,
        filters: GenerationFilters | None,
        count: int,
    ) -> list[GeneratedRecipe]: ...
