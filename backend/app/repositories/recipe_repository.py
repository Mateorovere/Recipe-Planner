from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient

_EAGER_LOAD = (
    selectinload(Recipe.recipe_ingredients).selectinload(RecipeIngredient.ingredient),
    selectinload(Recipe.steps),
    selectinload(Recipe.tags),
    selectinload(Recipe.nutrition),
)


class RecipeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, recipe_id: int) -> Recipe | None:
        result = await self._session.execute(
            select(Recipe).where(Recipe.id == recipe_id).options(*_EAGER_LOAD)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, recipe_ids: list[int]) -> list[Recipe]:
        if not recipe_ids:
            return []
        result = await self._session.execute(
            select(Recipe).where(Recipe.id.in_(recipe_ids)).options(*_EAGER_LOAD)
        )
        return list(result.scalars().all())

    async def find_candidates_by_ingredient_ids(self, ingredient_ids: list[int]) -> list[Recipe]:
        """Any recipe that uses at least one of the given ingredients."""
        if not ingredient_ids:
            return []
        result = await self._session.execute(
            select(Recipe)
            .join(RecipeIngredient, RecipeIngredient.recipe_id == Recipe.id)
            .where(RecipeIngredient.ingredient_id.in_(ingredient_ids))
            .distinct()
            .options(*_EAGER_LOAD)
        )
        return list(result.scalars().unique().all())

    async def list_all(self) -> list[Recipe]:
        result = await self._session.execute(select(Recipe).options(*_EAGER_LOAD))
        return list(result.scalars().unique().all())
