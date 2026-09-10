from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Difficulty, IngredientImportance, NutritionSource


class RecipeSearchFilters(BaseModel):
    max_total_time_minutes: int | None = Field(default=None, gt=0)
    difficulty: Difficulty | None = None
    dietary_tags: list[str] = Field(default_factory=list)
    """e.g. ["vegetarian", "high-protein"] — matched against recipe_tags."""


class RecipeSearchRequest(BaseModel):
    ingredients: list[str] = Field(min_length=1, max_length=100)
    filters: RecipeSearchFilters | None = None
    limit: int = Field(default=10, ge=1, le=50)


class RecipeIngredientSchema(BaseModel):
    name: str
    quantity: float | None
    unit: str | None
    importance: IngredientImportance
    have: bool
    """Whether the user's provided ingredient list already covers this one."""


class RecipeStepSchema(BaseModel):
    step_number: int
    instruction: str


class NutritionSchema(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    source: NutritionSource


class SubstitutionSchema(BaseModel):
    ingredient: str
    substitute: str
    notes: str | None = None


class RecipeSummary(BaseModel):
    """What a recipe results card needs."""

    id: int
    title: str
    slug: str
    image_url: str | None
    description: str
    prep_time_minutes: int
    cook_time_minutes: int
    total_time_minutes: int
    difficulty: Difficulty
    servings: int
    match_percentage: float = Field(ge=0.0, le=100.0)
    matched_ingredient_count: int
    total_ingredient_count: int
    missing_ingredients: list[str]


class RecipeDetail(RecipeSummary):
    """Full recipe detail page payload."""

    cuisine: str | None
    ingredients: list[RecipeIngredientSchema]
    steps: list[RecipeStepSchema]
    nutrition: NutritionSchema | None
    match_explanation: str
    substitutions: list[SubstitutionSchema]
    is_favorited: bool = False


class RecipeSearchResponse(BaseModel):
    recipes: list[RecipeSummary]
    ai_reranked: bool
    """True when the LLM reranking step actually ran; false if it was skipped/failed
    and the response reflects pure algorithmic ranking."""


class SavedRecipeItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recipe_id: int
    created_at: datetime


class SearchHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    query_ingredients: list[str]
    results_count: int
    created_at: datetime
