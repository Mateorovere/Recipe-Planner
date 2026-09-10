from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NoMatchingRecipesError
from app.models.enums import Difficulty
from app.models.ingredient import IngredientSubstitution
from app.schemas.recipe import RecipeSearchFilters
from app.services.recipe_service import RecipeService
from tests.fakes import FailingLLMProvider, FakeLLMProvider, FakeNutritionProvider
from tests.seed_helpers import seed_basic_recipes

pytestmark = pytest.mark.asyncio


def _service(session: AsyncSession, *, ai_rerank: bool = False) -> RecipeService:
    return RecipeService(
        session,
        llm_provider=FakeLLMProvider(),
        nutrition_provider=FakeNutritionProvider(),
        ai_rerank_enabled=ai_rerank,
    )


async def test_search_ranks_full_match_above_partial_match(db_session: AsyncSession) -> None:
    await seed_basic_recipes(db_session)
    service = _service(db_session)

    result = await service.search(
        ["egg", "tomato", "onion", "cheese"], filters=None, limit=10, user_id=None
    )

    titles = [r.title for r in result.recipes]
    assert titles[0] == "Tomato Cheese Omelette"
    assert result.recipes[0].match_percentage == 100.0
    assert result.ai_reranked is False


async def test_search_reports_missing_ingredients(db_session: AsyncSession) -> None:
    await seed_basic_recipes(db_session)
    service = _service(db_session)

    result = await service.search(["chicken"], filters=None, limit=10, user_id=None)

    fried_rice = next(r for r in result.recipes if r.title == "Chicken Fried Rice")
    assert set(fried_rice.missing_ingredients) == {"rice", "onion", "garlic", "soy sauce"}
    assert fried_rice.matched_ingredient_count == 1


async def test_search_raises_when_nothing_matches(db_session: AsyncSession) -> None:
    await seed_basic_recipes(db_session)
    service = _service(db_session)

    with pytest.raises(NoMatchingRecipesError):
        await service.search(["kiwi", "durian"], filters=None, limit=10, user_id=None)


async def test_ai_rerank_failure_falls_back_to_algorithmic_ranking(
    db_session: AsyncSession,
) -> None:
    await seed_basic_recipes(db_session)
    service = RecipeService(
        db_session,
        llm_provider=FailingLLMProvider(),
        nutrition_provider=FakeNutritionProvider(),
        ai_rerank_enabled=True,
    )

    result = await service.search(
        ["egg", "tomato", "onion", "cheese"], filters=None, limit=10, user_id=None
    )

    assert result.ai_reranked is False
    assert result.recipes[0].title == "Tomato Cheese Omelette"


async def test_ai_rerank_success_marks_response(db_session: AsyncSession) -> None:
    await seed_basic_recipes(db_session)
    service = _service(db_session, ai_rerank=True)

    result = await service.search(
        ["egg", "tomato", "onion", "cheese"], filters=None, limit=10, user_id=None
    )

    assert result.ai_reranked is True


async def test_search_filters_by_difficulty_and_time(db_session: AsyncSession) -> None:
    await seed_basic_recipes(db_session)
    service = _service(db_session)

    filters = RecipeSearchFilters(max_total_time_minutes=5, difficulty=Difficulty.EASY)
    with pytest.raises(NoMatchingRecipesError):
        await service.search(["egg", "tomato"], filters=filters, limit=10, user_id=None)


async def test_search_filters_by_dietary_tag(db_session: AsyncSession) -> None:
    await seed_basic_recipes(db_session)
    service = _service(db_session)

    filters = RecipeSearchFilters(dietary_tags=["vegetarian"])
    result = await service.search(
        ["egg", "tomato", "onion", "cheese", "chicken", "rice"],
        filters=filters,
        limit=10,
        user_id=None,
    )
    titles = {r.title for r in result.recipes}
    assert titles == {"Tomato Cheese Omelette"}


async def test_get_detail_uses_stored_nutrition_when_available(db_session: AsyncSession) -> None:
    seeded = await seed_basic_recipes(db_session)
    service = _service(db_session)

    detail = await service.get_detail(
        seeded["omelette"].id, raw_ingredients=["egg", "tomato"], user_id=None
    )

    assert detail.nutrition is not None
    assert detail.nutrition.source == "calculated"
    assert detail.nutrition.calories == 320


async def test_get_detail_estimates_and_persists_nutrition_when_missing(
    db_session: AsyncSession,
) -> None:
    seeded = await seed_basic_recipes(db_session)
    service = _service(db_session)

    detail = await service.get_detail(
        seeded["fried_rice"].id, raw_ingredients=["chicken", "rice"], user_id=None
    )

    assert detail.nutrition is not None
    assert detail.nutrition.source == "ai_generated"
    assert detail.nutrition.calories == 400.0

    # A second call should now read the persisted row rather than calling AI again.
    detail_again = await service.get_detail(
        seeded["fried_rice"].id, raw_ingredients=["chicken", "rice"], user_id=None
    )
    assert detail_again.nutrition is not None
    assert detail_again.nutrition.source == "ai_generated"


async def test_get_detail_reports_have_flags_and_explanation(db_session: AsyncSession) -> None:
    seeded = await seed_basic_recipes(db_session)
    service = _service(db_session)

    detail = await service.get_detail(seeded["omelette"].id, raw_ingredients=["egg"], user_id=None)

    egg_entry = next(i for i in detail.ingredients if i.name == "egg")
    tomato_entry = next(i for i in detail.ingredients if i.name == "tomato")
    assert egg_entry.have is True
    assert tomato_entry.have is False
    assert "1/4" in detail.match_explanation


async def test_get_detail_reports_is_favorited(db_session: AsyncSession) -> None:
    from app.repositories.favorite_repository import FavoriteRepository
    from app.repositories.user_repository import UserRepository

    seeded = await seed_basic_recipes(db_session)
    user = await UserRepository(db_session).create(
        email="fav@example.com", hashed_password="x", full_name=None
    )
    await db_session.commit()

    service = _service(db_session)
    before = await service.get_detail(seeded["omelette"].id, raw_ingredients=[], user_id=user.id)
    assert before.is_favorited is False

    await FavoriteRepository(db_session).add(user.id, seeded["omelette"].id)
    await db_session.commit()

    after = await service.get_detail(seeded["omelette"].id, raw_ingredients=[], user_id=user.id)
    assert after.is_favorited is True


async def test_get_detail_includes_substitutions(db_session: AsyncSession) -> None:
    seeded = await seed_basic_recipes(db_session)

    from sqlalchemy import select

    from app.models.ingredient import Ingredient

    egg = (
        await db_session.execute(select(Ingredient).where(Ingredient.name == "egg"))
    ).scalar_one()
    tofu = Ingredient(name="tofu", category="protein")
    db_session.add(tofu)
    await db_session.flush()
    db_session.add(
        IngredientSubstitution(
            ingredient_id=egg.id, substitute_ingredient_id=tofu.id, notes="for a vegan version"
        )
    )
    await db_session.commit()

    service = _service(db_session)
    detail = await service.get_detail(seeded["omelette"].id, raw_ingredients=["egg"], user_id=None)

    assert any(s.substitute == "tofu" for s in detail.substitutions)
