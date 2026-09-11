from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AIProviderError, NoMatchingRecipesError
from app.models.ingredient import Ingredient
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.ingredient import IngredientQuantityInput
from app.services.recipe_service import RecipeService
from tests.fakes import FakeRecipeGenerationProvider

pytestmark = pytest.mark.asyncio


def _service(session: AsyncSession, provider: FakeRecipeGenerationProvider) -> RecipeService:
    return RecipeService(
        session,
        generation_provider=provider,
        generation_model_name="fake-model",
        default_count=5,
    )


async def test_search_persists_generated_recipe_with_all_fields(db_session: AsyncSession) -> None:
    provider = FakeRecipeGenerationProvider(extra_ingredient="salt")
    service = _service(db_session, provider)

    result = await service.search(
        [
            IngredientQuantityInput(name="egg", quantity=2, unit="unit"),
            IngredientQuantityInput(name="tomato", quantity=1, unit="unit"),
        ],
        filters=None,
        count=1,
        user_id=None,
    )

    assert len(result.recipes) == 1
    summary = result.recipes[0]
    assert summary.title == "Fake Recipe with egg, tomato"
    assert summary.matched_ingredient_count == 2
    assert summary.total_ingredient_count == 3
    assert summary.missing_ingredients == ["salt"]
    assert summary.match_percentage == pytest.approx(66.7, abs=0.1)

    detail = await service.get_detail(summary.id, user_id=None)
    assert len(detail.steps) == 2
    assert detail.nutrition is not None
    assert detail.nutrition.source == "ai_generated"
    assert detail.nutrition.calories == 400.0
    have_flags = {i.name: i.have for i in detail.ingredients}
    assert have_flags == {"egg": True, "tomato": True, "salt": False}
    assert "matching ingredients" in detail.match_explanation


async def test_search_creates_unknown_ingredients_on_the_fly(db_session: AsyncSession) -> None:
    provider = FakeRecipeGenerationProvider(extra_ingredient="dragonfruit")
    service = _service(db_session, provider)

    await service.search([IngredientQuantityInput(name="egg")], filters=None, count=1, user_id=None)

    result = await db_session.execute(select(Ingredient).where(Ingredient.name == "dragonfruit"))
    assert result.scalar_one_or_none() is not None


async def test_search_raises_when_ai_returns_no_recipes(db_session: AsyncSession) -> None:
    provider = FakeRecipeGenerationProvider(return_empty=True)
    service = _service(db_session, provider)

    with pytest.raises(NoMatchingRecipesError):
        await service.search(
            [IngredientQuantityInput(name="egg")], filters=None, count=1, user_id=None
        )


async def test_search_propagates_provider_failure(db_session: AsyncSession) -> None:
    provider = FakeRecipeGenerationProvider(raise_error=True)
    service = _service(db_session, provider)

    with pytest.raises(AIProviderError):
        await service.search(
            [IngredientQuantityInput(name="egg")], filters=None, count=1, user_id=None
        )


async def test_get_detail_not_found_raises(db_session: AsyncSession) -> None:
    from app.core.exceptions import NotFoundError

    service = _service(db_session, FakeRecipeGenerationProvider())
    with pytest.raises(NotFoundError):
        await service.get_detail(999999, user_id=None)


async def test_favoriting_a_generated_recipe_works(db_session: AsyncSession) -> None:
    provider = FakeRecipeGenerationProvider()
    service = _service(db_session, provider)
    user = await UserRepository(db_session).create(
        email="fav@example.com", hashed_password="x", full_name=None
    )
    await db_session.commit()

    result = await service.search(
        [IngredientQuantityInput(name="egg")], filters=None, count=1, user_id=user.id
    )
    recipe_id = result.recipes[0].id

    favorites = FavoriteRepository(db_session)
    await favorites.add(user.id, recipe_id)
    await db_session.commit()

    detail = await service.get_detail(recipe_id, user_id=user.id)
    assert detail.is_favorited is True


async def test_duplicate_recipe_titles_get_unique_slugs(db_session: AsyncSession) -> None:
    provider = FakeRecipeGenerationProvider()
    service = _service(db_session, provider)

    first = await service.search(
        [IngredientQuantityInput(name="egg")], filters=None, count=1, user_id=None
    )
    second = await service.search(
        [IngredientQuantityInput(name="egg")], filters=None, count=1, user_id=None
    )

    assert first.recipes[0].slug != second.recipes[0].slug
