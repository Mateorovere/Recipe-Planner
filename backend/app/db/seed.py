"""Idempotent database seeding.

Run with `uv run python -m app.db.seed`. Also invoked automatically by the backend
container's entrypoint in Docker Compose so the app works immediately after
`docker compose up`, with no external recipe API required.
"""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed_data import INGREDIENTS, RECIPES
from app.db.session import get_sessionmaker
from app.models.enums import NutritionSource
from app.models.ingredient import Ingredient
from app.models.nutrition import NutritionInformation
from app.models.recipe import Recipe, RecipeStep, RecipeTag
from app.models.recipe_ingredient import RecipeIngredient

logger = logging.getLogger(__name__)


async def _upsert_ingredients(session: AsyncSession) -> dict[str, int]:
    existing = await session.execute(select(Ingredient))
    by_name = {i.name: i for i in existing.scalars().all()}

    created = 0
    for name, category in INGREDIENTS:
        if name in by_name:
            continue
        ingredient = Ingredient(name=name, category=category)
        session.add(ingredient)
        by_name[name] = ingredient
        created += 1

    if created:
        await session.flush()
    logger.info("Ingredients: %d created, %d already present", created, len(by_name) - created)
    return {name: ingredient.id for name, ingredient in by_name.items()}


async def _seed_recipes(session: AsyncSession, ingredient_ids: dict[str, int]) -> None:
    existing_slugs = set((await session.execute(select(Recipe.slug))).scalars().all())

    created = 0
    for recipe_seed in RECIPES:
        if recipe_seed["slug"] in existing_slugs:
            continue

        recipe = Recipe(
            title=recipe_seed["title"],
            slug=recipe_seed["slug"],
            description=recipe_seed["description"],
            image_url=recipe_seed["image_url"],
            prep_time_minutes=recipe_seed["prep_time_minutes"],
            cook_time_minutes=recipe_seed["cook_time_minutes"],
            difficulty=recipe_seed["difficulty"],
            servings=recipe_seed["servings"],
            cuisine=recipe_seed["cuisine"],
        )
        session.add(recipe)
        await session.flush()

        for i, instruction in enumerate(recipe_seed["steps"], start=1):
            session.add(RecipeStep(recipe_id=recipe.id, step_number=i, instruction=instruction))

        for tag in recipe_seed["tags"]:
            session.add(RecipeTag(recipe_id=recipe.id, tag=tag))

        for ri in recipe_seed["ingredients"]:
            ingredient_id = ingredient_ids.get(ri["name"])
            if ingredient_id is None:
                raise ValueError(
                    f"Recipe '{recipe_seed['title']}' references unknown ingredient "
                    f"'{ri['name']}'. Add it to INGREDIENTS in seed_data.py."
                )
            session.add(
                RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient_id,
                    quantity=ri["quantity"],
                    unit=ri["unit"],
                    importance=ri["importance"],
                )
            )

        n = recipe_seed["nutrition"]
        session.add(
            NutritionInformation(
                recipe_id=recipe.id,
                calories=n["calories"],
                protein_g=n["protein_g"],
                carbs_g=n["carbs_g"],
                fat_g=n["fat_g"],
                fiber_g=n["fiber_g"],
                source=NutritionSource.DATABASE,
            )
        )
        created += 1

    logger.info("Recipes: %d created, %d already present", created, len(existing_slugs))


async def seed(session: AsyncSession) -> None:
    ingredient_ids = await _upsert_ingredients(session)
    await _seed_recipes(session, ingredient_ids)
    await session.commit()
    logger.info("Seeding complete.")


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
