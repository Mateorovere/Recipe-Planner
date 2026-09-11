"""Recipe generation: ingredients (+ quantities) -> freshly generated, persisted
recipes.

Recipes are never looked up from a fixed catalog. Each search sends the user's
ingredients straight to the configured `RecipeGenerationProvider`, and every
recipe it returns is persisted immediately — so favorites, the detail page, and
history all keep working on a real, stable `recipe_id`. Unlike the old ranking
pipeline, there's no algorithmic fallback here: generation *is* the feature, so a
provider failure surfaces as a clean error instead of silently degrading.
"""

from __future__ import annotations

import logging
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import RecipeGenerationProvider
from app.ai.types import GeneratedRecipe, GenerationFilters, IngredientQuantity
from app.core.exceptions import NoMatchingRecipesError, NotFoundError
from app.models.enums import Difficulty, IngredientImportance, NutritionSource
from app.models.nutrition import NutritionInformation
from app.models.recipe import Recipe, RecipeStep, RecipeTag
from app.models.recipe_ingredient import RecipeIngredient
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.ingredient_repository import IngredientRepository
from app.repositories.recipe_repository import RecipeRepository
from app.repositories.search_repository import SearchRepository
from app.schemas.ingredient import IngredientQuantityInput
from app.schemas.recipe import (
    RecipeDetail,
    RecipeIngredientSchema,
    RecipeSearchFilters,
    RecipeSearchResponse,
    RecipeStepSchema,
    SubstitutionSchema,
)
from app.services.ingredient_normalization import IngredientNormalizer
from app.services.recipe_presentation import nutrition_to_schema, recipe_to_summary

logger = logging.getLogger(__name__)

_VALID_DIFFICULTIES = {d.value for d in Difficulty}
_VALID_IMPORTANCE = {i.value for i in IngredientImportance}
_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(title: str) -> str:
    slug = _SLUG_RE.sub("-", title.lower()).strip("-")
    return slug or "recipe"


class RecipeService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        generation_provider: RecipeGenerationProvider,
        generation_model_name: str,
        default_count: int,
    ) -> None:
        self._session = session
        self._generator = generation_provider
        self._model_name = generation_model_name
        self._default_count = default_count
        self._recipes = RecipeRepository(session)
        self._ingredients = IngredientRepository(session)
        self._normalizer = IngredientNormalizer(session)
        self._searches = SearchRepository(session)
        self._favorites = FavoriteRepository(session)

    # ------------------------------------------------------------------ search

    async def search(
        self,
        ingredients: list[IngredientQuantityInput],
        *,
        filters: RecipeSearchFilters | None,
        count: int | None,
        user_id: int | None,
    ) -> RecipeSearchResponse:
        # Normalize names for consistency/dedup, but keep each ingredient's own
        # quantity/unit alongside whichever canonical name we land on.
        normalized = await self._normalizer.normalize_many([i.name for i in ingredients])
        canonical_name_by_raw = {
            n.raw_name: (n.ingredient.name if n.ingredient else n.raw_name) for n in normalized
        }
        provider_ingredients = [
            IngredientQuantity(
                name=canonical_name_by_raw.get(i.name, i.name),
                quantity=i.quantity,
                unit=i.unit,
            )
            for i in ingredients
        ]

        generation_filters = (
            GenerationFilters(
                max_total_time_minutes=filters.max_total_time_minutes,
                difficulty=filters.difficulty.value if filters.difficulty else None,
                dietary_tags=filters.dietary_tags,
            )
            if filters
            else None
        )

        generated = await self._generator.generate_recipes(
            provider_ingredients,
            filters=generation_filters,
            count=count or self._default_count,
        )
        if not generated:
            raise NoMatchingRecipesError(
                "We couldn't come up with a recipe from those ingredients. Try "
                "adding a few more, or broadening your list."
            )

        recipes = [await self._persist(g) for g in generated]

        await self._searches.record(
            user_id=user_id,
            query_ingredients=[
                {"name": i.name, "quantity": i.quantity, "unit": i.unit} for i in ingredients
            ],
            results_count=len(recipes),
        )
        await self._session.commit()

        return RecipeSearchResponse(recipes=[recipe_to_summary(r) for r in recipes])

    # ------------------------------------------------------------------ detail

    async def get_detail(self, recipe_id: int, *, user_id: int | None) -> RecipeDetail:
        recipe = await self._recipes.get_by_id(recipe_id)
        if recipe is None:
            raise NotFoundError(f"Recipe {recipe_id} was not found.", code="recipe_not_found")

        is_favorited = (
            await self._favorites.is_favorited(user_id, recipe_id) if user_id is not None else False
        )

        summary = recipe_to_summary(recipe)
        return RecipeDetail(
            **summary.model_dump(),
            cuisine=recipe.cuisine,
            ingredients=[
                RecipeIngredientSchema(
                    name=ri.ingredient.name,
                    quantity=ri.quantity,
                    unit=ri.unit,
                    importance=ri.importance,
                    have=ri.user_has,
                )
                for ri in recipe.recipe_ingredients
            ],
            steps=[
                RecipeStepSchema(step_number=s.step_number, instruction=s.instruction)
                for s in recipe.steps
            ],
            nutrition=nutrition_to_schema(recipe.nutrition),
            match_explanation=recipe.match_explanation,
            substitutions=[SubstitutionSchema(**s) for s in (recipe.substitutions or [])],
            is_favorited=is_favorited,
        )

    # ------------------------------------------------------------------ persistence

    async def _persist(self, generated: GeneratedRecipe) -> Recipe:
        difficulty_value = (
            generated.difficulty if generated.difficulty in _VALID_DIFFICULTIES else "medium"
        )
        recipe = Recipe(
            title=generated.title or "Untitled recipe",
            slug=await self._unique_slug(generated.title or "recipe"),
            description=generated.description,
            image_url=None,
            prep_time_minutes=max(0, generated.prep_time_minutes),
            cook_time_minutes=max(0, generated.cook_time_minutes),
            difficulty=Difficulty(difficulty_value),
            servings=generated.servings,
            cuisine=generated.cuisine,
            source=f"ai_generated:{self._model_name}",
            match_explanation=generated.match_explanation,
            substitutions=[
                {"ingredient": s.ingredient, "substitute": s.substitute, "notes": s.notes}
                for s in generated.substitutions
            ]
            or None,
        )
        self._session.add(recipe)
        await self._session.flush()

        for i, instruction in enumerate(generated.steps, start=1):
            self._session.add(
                RecipeStep(recipe_id=recipe.id, step_number=i, instruction=instruction)
            )

        for tag in generated.tags:
            self._session.add(RecipeTag(recipe_id=recipe.id, tag=tag))

        for gi in generated.ingredients:
            if not gi.name:
                continue
            ingredient = await self._ingredients.get_or_create(gi.name)
            importance = gi.importance if gi.importance in _VALID_IMPORTANCE else "normal"
            self._session.add(
                RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient.id,
                    quantity=gi.quantity,
                    unit=gi.unit,
                    importance=IngredientImportance(importance),
                    user_has=gi.user_has,
                )
            )

        n = generated.nutrition
        self._session.add(
            NutritionInformation(
                recipe_id=recipe.id,
                calories=n.calories,
                protein_g=n.protein_g,
                carbs_g=n.carbs_g,
                fat_g=n.fat_g,
                fiber_g=n.fiber_g,
                source=NutritionSource.AI_GENERATED,
            )
        )

        await self._session.flush()
        # Re-fetch with everything eager-loaded so summary/detail building never
        # triggers a lazy load on the async session.
        persisted = await self._recipes.get_by_id(recipe.id)
        if persisted is None:  # pragma: no cover - just flushed above, defensive only
            raise NotFoundError(f"Recipe {recipe.id} vanished after being created.")
        return persisted

    async def _unique_slug(self, title: str) -> str:
        base = _slugify(title)
        candidate = base
        suffix = 1
        while await self._recipes.slug_exists(candidate):
            suffix += 1
            candidate = f"{base}-{suffix}"
        return candidate
