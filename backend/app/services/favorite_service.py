from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.recipe_repository import RecipeRepository
from app.repositories.search_repository import SearchRepository
from app.repositories.user_ingredient_repository import UserIngredientRepository
from app.schemas.ingredient import IngredientHistoryItem
from app.schemas.recipe import RecipeSummary, SearchHistoryItem


class FavoriteService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._favorites = FavoriteRepository(session)
        self._recipes = RecipeRepository(session)

    async def add(self, user_id: int, recipe_id: int) -> None:
        recipe = await self._recipes.get_by_id(recipe_id)
        if recipe is None:
            raise NotFoundError(f"Recipe {recipe_id} was not found.", code="recipe_not_found")
        await self._favorites.add(user_id, recipe_id)
        await self._session.commit()

    async def remove(self, user_id: int, recipe_id: int) -> None:
        removed = await self._favorites.remove(user_id, recipe_id)
        await self._session.commit()
        if not removed:
            raise NotFoundError("That recipe wasn't in your favorites.", code="favorite_not_found")

    async def list_for_user(self, user_id: int) -> list[RecipeSummary]:
        saved = await self._favorites.list_for_user(user_id)
        recipes = await self._recipes.get_by_ids([s.recipe_id for s in saved])
        by_id = {r.id: r for r in recipes}
        summaries = []
        for s in saved:
            recipe = by_id.get(s.recipe_id)
            if recipe is None:
                continue
            total = len(recipe.recipe_ingredients)
            summaries.append(
                RecipeSummary(
                    id=recipe.id,
                    title=recipe.title,
                    slug=recipe.slug,
                    image_url=recipe.image_url,
                    description=recipe.description,
                    prep_time_minutes=recipe.prep_time_minutes,
                    cook_time_minutes=recipe.cook_time_minutes,
                    total_time_minutes=recipe.total_time_minutes,
                    difficulty=recipe.difficulty,
                    servings=recipe.servings,
                    match_percentage=0.0,
                    matched_ingredient_count=0,
                    total_ingredient_count=total,
                    missing_ingredients=[ri.ingredient.name for ri in recipe.recipe_ingredients],
                )
            )
        return summaries


class HistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._searches = SearchRepository(session)
        self._ingredient_history = UserIngredientRepository(session)

    async def get_search_history(self, user_id: int) -> list[SearchHistoryItem]:
        searches = await self._searches.list_for_user(user_id)
        return [SearchHistoryItem.model_validate(s) for s in searches]

    async def get_ingredient_history(self, user_id: int) -> list[IngredientHistoryItem]:
        items = await self._ingredient_history.list_for_user(user_id)
        return [IngredientHistoryItem.model_validate(i) for i in items]
