"""Idempotent database seeding.

Run with `uv run python -m app.db.seed`. Also invoked automatically by the backend
container's entrypoint in Docker Compose so the ingredient dictionary is
populated the moment the app starts. Recipes are no longer seeded from a fixed
catalog — they're generated live and persisted as users search (see
`app/services/recipe_service.py`).
"""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed_data import INGREDIENTS
from app.db.session import get_sessionmaker
from app.models.ingredient import Ingredient

logger = logging.getLogger(__name__)


async def _upsert_ingredients(session: AsyncSession) -> None:
    existing = await session.execute(select(Ingredient.name))
    existing_names = set(existing.scalars().all())

    created = 0
    for name, category in INGREDIENTS:
        if name in existing_names:
            continue
        session.add(Ingredient(name=name, category=category))
        created += 1

    logger.info("Ingredients: %d created, %d already present", created, len(existing_names))


async def seed(session: AsyncSession) -> None:
    await _upsert_ingredients(session)
    await session.commit()
    logger.info("Seeding complete.")


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
