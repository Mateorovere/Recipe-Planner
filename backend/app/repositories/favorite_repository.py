from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_recipe import SavedRecipe


class FavoriteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def is_favorited(self, user_id: int, recipe_id: int) -> bool:
        result = await self._session.execute(
            select(SavedRecipe.id).where(
                SavedRecipe.user_id == user_id, SavedRecipe.recipe_id == recipe_id
            )
        )
        return result.scalar_one_or_none() is not None

    async def add(self, user_id: int, recipe_id: int) -> SavedRecipe:
        existing = await self._session.execute(
            select(SavedRecipe).where(
                SavedRecipe.user_id == user_id, SavedRecipe.recipe_id == recipe_id
            )
        )
        found = existing.scalar_one_or_none()
        if found is not None:
            return found
        saved = SavedRecipe(user_id=user_id, recipe_id=recipe_id)
        self._session.add(saved)
        await self._session.flush()
        return saved

    async def remove(self, user_id: int, recipe_id: int) -> bool:
        result = await self._session.execute(
            select(SavedRecipe).where(
                SavedRecipe.user_id == user_id, SavedRecipe.recipe_id == recipe_id
            )
        )
        saved = result.scalar_one_or_none()
        if saved is None:
            return False
        await self._session.delete(saved)
        await self._session.flush()
        return True

    async def list_for_user(self, user_id: int) -> list[SavedRecipe]:
        result = await self._session.execute(
            select(SavedRecipe)
            .where(SavedRecipe.user_id == user_id)
            .order_by(SavedRecipe.created_at.desc())
        )
        return list(result.scalars().all())

    async def favorited_recipe_ids(self, user_id: int) -> set[int]:
        result = await self._session.execute(
            select(SavedRecipe.recipe_id).where(SavedRecipe.user_id == user_id)
        )
        return set(result.scalars().all())
