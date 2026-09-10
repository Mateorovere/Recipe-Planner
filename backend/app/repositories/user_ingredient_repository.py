from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import IngredientInputSource
from app.models.user_ingredient import UserIngredient


class UserIngredientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record_many(
        self,
        *,
        user_id: int,
        source: IngredientInputSource,
        items: list[tuple[str, int | None, float | None]],
    ) -> list[UserIngredient]:
        """`items` is a list of (raw_label, matched_ingredient_id, confidence)."""
        records = [
            UserIngredient(
                user_id=user_id,
                raw_label=raw_label,
                ingredient_id=ingredient_id,
                confidence=confidence,
                source=source,
            )
            for raw_label, ingredient_id, confidence in items
        ]
        self._session.add_all(records)
        await self._session.flush()
        return records

    async def list_for_user(self, user_id: int, limit: int = 100) -> list[UserIngredient]:
        result = await self._session.execute(
            select(UserIngredient)
            .where(UserIngredient.user_id == user_id)
            .order_by(UserIngredient.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
