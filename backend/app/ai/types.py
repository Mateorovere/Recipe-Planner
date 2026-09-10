"""Plain data types shared by the AI provider interfaces.

Kept independent of both the SQLAlchemy models and the API Pydantic schemas so the
`ai/` package has zero knowledge of the database or the web framework — only the
service layer bridges between them.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class RawDetectedIngredient:
    name: str
    confidence: float | None = None


@dataclass(frozen=True, slots=True)
class RecipeRerankCandidate:
    """What the LLM reranker sees for one candidate recipe."""

    recipe_id: int
    title: str
    matched_ingredients: list[str]
    missing_ingredients: list[str]
    base_score: float


@dataclass(frozen=True, slots=True)
class RerankResult:
    recipe_id: int
    adjusted_score: float
    explanation: str


@dataclass(frozen=True, slots=True)
class NutritionEstimate:
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    source: str = "ai_generated"
    notes: str = field(default="")
