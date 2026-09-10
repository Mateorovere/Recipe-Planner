"""Ingredient normalization: raw text -> canonical `Ingredient` rows.

Used both when recording ingredient history and as step 1 of the recipe retrieval
pipeline (`recipe_service.py`), so both paths agree on what an ingredient "is".
"""

from __future__ import annotations

import difflib
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient
from app.repositories.ingredient_repository import IngredientRepository

_FUZZY_MATCH_CUTOFF = 0.82


@dataclass(frozen=True, slots=True)
class NormalizedIngredient:
    raw_name: str
    ingredient: Ingredient | None
    """None means no canonical ingredient in the database matched closely enough."""


class IngredientNormalizer:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = IngredientRepository(session)

    async def normalize_many(self, raw_names: list[str]) -> list[NormalizedIngredient]:
        all_ingredients = await self._repo.list_all()
        by_lower_name = {ingredient.name.lower(): ingredient for ingredient in all_ingredients}
        candidate_names = list(by_lower_name.keys())

        results: list[NormalizedIngredient] = []
        for raw in raw_names:
            cleaned = raw.strip().lower()
            if not cleaned:
                continue

            ingredient = by_lower_name.get(cleaned)
            if ingredient is None:
                exact = await self._repo.get_by_exact_name_or_alias(cleaned)
                ingredient = exact

            if ingredient is None and candidate_names:
                close = difflib.get_close_matches(
                    cleaned, candidate_names, n=1, cutoff=_FUZZY_MATCH_CUTOFF
                )
                if close:
                    ingredient = by_lower_name[close[0]]

            results.append(NormalizedIngredient(raw_name=raw, ingredient=ingredient))
        return results
