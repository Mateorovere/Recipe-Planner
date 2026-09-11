"""Builds API-facing `RecipeSummary`/nutrition schemas from a persisted `Recipe`.

Shared between `recipe_service.py` (search/detail) and `favorite_service.py` (the
favorites list) so both present the same match info, computed the same way, from
the `recipe_ingredients.user_has` flags that were decided once at generation time.
"""

from __future__ import annotations

from app.models.nutrition import NutritionInformation
from app.models.recipe import Recipe
from app.schemas.recipe import ImageAttributionSchema, NutritionSchema, RecipeSummary


def recipe_to_summary(recipe: Recipe) -> RecipeSummary:
    matched = sum(1 for ri in recipe.recipe_ingredients if ri.user_has)
    total = len(recipe.recipe_ingredients)
    missing = [ri.ingredient.name for ri in recipe.recipe_ingredients if not ri.user_has]
    percentage = (matched / total * 100) if total else 0.0

    return RecipeSummary(
        id=recipe.id,
        title=recipe.title,
        slug=recipe.slug,
        image_url=recipe.image_url,
        image_attribution=(
            ImageAttributionSchema(**recipe.image_attribution) if recipe.image_attribution else None
        ),
        description=recipe.description,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        total_time_minutes=recipe.total_time_minutes,
        difficulty=recipe.difficulty,
        servings=recipe.servings,
        match_percentage=round(percentage, 1),
        matched_ingredient_count=matched,
        total_ingredient_count=total,
        missing_ingredients=missing,
        tags=[t.tag for t in recipe.tags],
    )


def nutrition_to_schema(nutrition: NutritionInformation | None) -> NutritionSchema | None:
    if nutrition is None:
        return None
    return NutritionSchema(
        calories=nutrition.calories,
        protein_g=nutrition.protein_g,
        carbs_g=nutrition.carbs_g,
        fat_g=nutrition.fat_g,
        fiber_g=nutrition.fiber_g,
        source=nutrition.source,
    )
