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

    async def slug_exists(self, slug: str) -> bool:
        result = await self._session.execute(select(Recipe.id).where(Recipe.slug == slug))
        return result.scalar_one_or_none() is not None
