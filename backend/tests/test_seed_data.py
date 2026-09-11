from __future__ import annotations

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed
from app.db.seed_data import INGREDIENTS
from app.models.ingredient import Ingredient


def test_ingredient_names_are_unique() -> None:
    names = [name for name, _ in INGREDIENTS]
    assert len(names) == len(set(names))


def test_ingredients_have_categories() -> None:
    for name, category in INGREDIENTS:
        assert name.strip() == name and name == name.lower()
        assert category


@pytest.mark.asyncio
async def test_seed_is_idempotent(db_session: AsyncSession) -> None:
    await seed(db_session)
    first_count = (
        await db_session.execute(select(func.count()).select_from(Ingredient))
    ).scalar_one()

    await seed(db_session)  # run again
    second_count = (
        await db_session.execute(select(func.count()).select_from(Ingredient))
    ).scalar_one()

    assert first_count == second_count == len(INGREDIENTS)
