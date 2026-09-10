from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient, IngredientAlias
from app.services.ingredient_normalization import IngredientNormalizer

pytestmark = pytest.mark.asyncio


async def test_normalize_exact_match(db_session: AsyncSession) -> None:
    db_session.add(Ingredient(name="tomato", category="produce"))
    await db_session.commit()

    results = await IngredientNormalizer(db_session).normalize_many(["Tomato"])
    assert results[0].ingredient is not None
    assert results[0].ingredient.name == "tomato"


async def test_normalize_alias_match(db_session: AsyncSession) -> None:
    tomato = Ingredient(name="tomato", category="produce")
    db_session.add(tomato)
    await db_session.flush()
    db_session.add(IngredientAlias(ingredient_id=tomato.id, alias="tomatoes"))
    await db_session.commit()

    results = await IngredientNormalizer(db_session).normalize_many(["tomatoes"])
    assert results[0].ingredient is not None
    assert results[0].ingredient.name == "tomato"


async def test_normalize_fuzzy_match(db_session: AsyncSession) -> None:
    db_session.add(Ingredient(name="broccoli", category="produce"))
    await db_session.commit()

    results = await IngredientNormalizer(db_session).normalize_many(["brocoli"])
    assert results[0].ingredient is not None
    assert results[0].ingredient.name == "broccoli"


async def test_normalize_no_match_returns_none(db_session: AsyncSession) -> None:
    db_session.add(Ingredient(name="broccoli", category="produce"))
    await db_session.commit()

    results = await IngredientNormalizer(db_session).normalize_many(["spaceship fuel"])
    assert results[0].ingredient is None
