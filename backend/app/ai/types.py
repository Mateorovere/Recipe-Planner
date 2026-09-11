"""Plain data types shared by the AI provider interfaces.

Kept independent of both the SQLAlchemy models and the API Pydantic schemas so the
`ai/` package has zero knowledge of the database or the web framework — only the
service layer bridges between them.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

ImportanceLiteral = Literal["critical", "normal", "optional"]


@dataclass(frozen=True, slots=True)
class RawDetectedIngredient:
    name: str
    confidence: float | None = None
    quantity: float | None = None
    unit: str | None = None


@dataclass(frozen=True, slots=True)
class IngredientQuantity:
    """One ingredient the user has, as sent into recipe generation."""

    name: str
    quantity: float | None = None
    unit: str | None = None


@dataclass(frozen=True, slots=True)
class GenerationFilters:
    max_total_time_minutes: int | None = None
    difficulty: str | None = None
    dietary_tags: list[str] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class GeneratedRecipeIngredient:
    name: str
    quantity: float | None
    unit: str | None
    importance: ImportanceLiteral
    user_has: bool
    """True if this ingredient came from the user's provided list."""


@dataclass(frozen=True, slots=True)
class GeneratedNutrition:
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


@dataclass(frozen=True, slots=True)
class GeneratedSubstitution:
    ingredient: str
    substitute: str
    notes: str = ""


@dataclass(frozen=True, slots=True)
class GeneratedRecipe:
    title: str
    description: str
    cuisine: str | None
    difficulty: str
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    ingredients: list[GeneratedRecipeIngredient]
    steps: list[str]
    nutrition: GeneratedNutrition
    tags: list[str]
    substitutions: list[GeneratedSubstitution]
    match_explanation: str
