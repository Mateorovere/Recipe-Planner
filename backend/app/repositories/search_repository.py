from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recipe_search import RecipeSearch


class SearchRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self, *, user_id: int | None, query_ingredients: list[str], results_count: int
    ) -> RecipeSearch:
        search = RecipeSearch(
            user_id=user_id, query_ingredients=query_ingredients, results_count=results_count
        )
        self._session.add(search)
        await self._session.flush()
        return search

    async def list_for_user(self, user_id: int, limit: int = 50) -> list[RecipeSearch]:
        result = await self._session.execute(
            select(RecipeSearch)
            .where(RecipeSearch.user_id == user_id)
            .order_by(RecipeSearch.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
