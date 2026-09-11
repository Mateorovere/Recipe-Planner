from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient, IngredientAlias


class IngredientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_exact_name_or_alias(self, name: str) -> Ingredient | None:
        normalized = name.strip().lower()
        result = await self._session.execute(
            select(Ingredient).where(func.lower(Ingredient.name) == normalized)
        )
        ingredient = result.scalar_one_or_none()
        if ingredient is not None:
            return ingredient

        alias_result = await self._session.execute(
            select(Ingredient)
            .join(IngredientAlias, IngredientAlias.ingredient_id == Ingredient.id)
            .where(func.lower(IngredientAlias.alias) == normalized)
        )
        return alias_result.scalar_one_or_none()

    async def list_all(self) -> list[Ingredient]:
        result = await self._session.execute(select(Ingredient))
        return list(result.scalars().all())

    async def get_by_ids(self, ingredient_ids: list[int]) -> list[Ingredient]:
        if not ingredient_ids:
            return []
        result = await self._session.execute(
            select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
        )
        return list(result.scalars().all())

    async def get_or_create(self, name: str, *, category: str | None = None) -> Ingredient:
        """Look up a canonical ingredient by exact name/alias, creating one if the
        AI introduced a name that isn't in the dictionary yet."""
        existing = await self.get_by_exact_name_or_alias(name)
        if existing is not None:
            return existing

        ingredient = Ingredient(name=name.strip().lower(), category=category)
        self._session.add(ingredient)
        await self._session.flush()
        return ingredient
