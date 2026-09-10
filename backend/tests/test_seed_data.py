from __future__ import annotations

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed
from app.db.seed_data import INGREDIENTS, RECIPES
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe

_REQUIRED_TAGS = {"breakfast", "lunch", "dinner", "vegetarian", "high-protein", "quick", "dessert"}


def test_every_recipe_ingredient_is_a_known_ingredient() -> None:
    known = {name for name, _ in INGREDIENTS}
    for recipe in RECIPES:
        for ri in recipe["ingredients"]:
            assert ri["name"] in known, f"{recipe['title']} uses unknown ingredient {ri['name']}"


def test_recipe_slugs_are_unique() -> None:
    slugs = [r["slug"] for r in RECIPES]
    assert len(slugs) == len(set(slugs))


def test_ingredient_names_are_unique() -> None:
    names = [name for name, _ in INGREDIENTS]
    assert len(names) == len(set(names))


def test_recipe_catalog_covers_required_categories() -> None:
    all_tags: set[str] = set()
    for recipe in RECIPES:
        all_tags.update(recipe["tags"])
    assert _REQUIRED_TAGS.issubset(all_tags)


def test_every_recipe_has_steps_and_nutrition() -> None:
    for recipe in RECIPES:
        assert recipe["steps"], f"{recipe['title']} has no steps"
        assert recipe["ingredients"], f"{recipe['title']} has no ingredients"
        for field in ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g"):
            assert recipe["nutrition"][field] >= 0


@pytest.mark.asyncio
async def test_seed_is_idempotent(db_session: AsyncSession) -> None:
    await seed(db_session)
    first_ingredient_count = (
        await db_session.execute(select(func.count()).select_from(Ingredient))
    ).scalar_one()
    first_recipe_count = (
        await db_session.execute(select(func.count()).select_from(Recipe))
    ).scalar_one()

    await seed(db_session)  # run again
    second_ingredient_count = (
        await db_session.execute(select(func.count()).select_from(Ingredient))
    ).scalar_one()
    second_recipe_count = (
        await db_session.execute(select(func.count()).select_from(Recipe))
    ).scalar_one()

    assert first_ingredient_count == second_ingredient_count == len(INGREDIENTS)
    assert first_recipe_count == second_recipe_count == len(RECIPES)
