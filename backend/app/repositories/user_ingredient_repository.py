from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import IngredientInputSource
from app.models.user_ingredient import UserIngredient


@dataclass(frozen=True, slots=True)
class UserIngredientRecord:
    raw_label: str
    ingredient_id: int | None
    confidence: float | None
    quantity: float | None = None
    unit: str | None = None


class UserIngredientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record_many(
        self,
        *,
        user_id: int,
        source: IngredientInputSource,
        items: list[UserIngredientRecord],
    ) -> list[UserIngredient]:
        records = [
            UserIngredient(
                user_id=user_id,
                raw_label=item.raw_label,
                ingredient_id=item.ingredient_id,
                confidence=item.confidence,
                quantity=item.quantity,
                unit=item.unit,
                source=source,
            )
            for item in items
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
