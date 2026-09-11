from __future__ import annotations

import json

from app.ai.base import RecipeGenerationProvider
from app.ai.providers._openai_client import build_client, chat_json
from app.ai.types import (
    GeneratedNutrition,
    GeneratedRecipe,
    GeneratedRecipeIngredient,
    GeneratedSubstitution,
    GenerationFilters,
    ImportanceLiteral,
    IngredientQuantity,
)
from app.core.exceptions import AIProviderError

_IMPORTANCE_VALUES: frozenset[ImportanceLiteral] = frozenset({"critical", "normal", "optional"})


def _as_int(value: object, default: int = 0) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int | float):
        return int(value)
    if isinstance(value, str) and value.strip():
        return int(float(value))
    return default


def _as_importance(value: object) -> ImportanceLiteral:
    text = str(value).strip().lower() if value else "normal"
    for candidate in _IMPORTANCE_VALUES:
        if text == candidate:
            return candidate
    return "normal"


_SYSTEM_PROMPT = (
    "You are a professional home-cooking assistant. Given a list of ingredients "
    "the user has on hand (with optional quantities/units) and optional "
    "preferences, invent {count} distinct, realistic, cookable recipes that make "
    "good use of those ingredients. You may assume the user has basic pantry "
    "staples (salt, pepper, oil, water) even if not listed, but mark any other "
    "ingredient not in the user's list as user_has=false so they know what to buy. "
    "Prefer recipes that use as many of the given ingredients as sensibly "
    "possible; it is fine to leave some unused if they don't fit together. "
    "Respond ONLY with JSON of this shape:\n"
    "{\n"
    '  "recipes": [\n'
    "    {\n"
    '      "title": "string",\n'
    '      "description": "one or two sentences",\n'
    '      "cuisine": "string or null",\n'
    '      "difficulty": "easy" | "medium" | "hard",\n'
    '      "prep_time_minutes": int,\n'
    '      "cook_time_minutes": int,\n'
    '      "servings": int,\n'
    '      "ingredients": [\n'
    '        {"name": "lowercase singular name", "quantity": number|null, '
    '"unit": "string or null", "importance": "critical"|"normal"|"optional", '
    '"user_has": boolean}\n'
    "      ],\n"
    '      "steps": ["step 1", "step 2", ...],\n'
    '      "nutrition": {"calories": number, "protein_g": number, '
    '"carbs_g": number, "fat_g": number, "fiber_g": number},\n'
    '      "tags": ["breakfast"|"lunch"|"dinner"|"dessert"|"vegetarian"|'
    '"high-protein"|"quick"|...],\n'
    '      "substitutions": [{"ingredient": "string", "substitute": "string", '
    '"notes": "string"}],\n'
    '      "match_explanation": "one short friendly sentence for this user"\n'
    "    }\n"
    "  ]\n"
    "}\n"
    "nutrition values are per serving, best-effort estimates - not medically "
    'precise. If you truly cannot make anything sensible, return {"recipes": []}.'
)


class OpenAIRecipeGenerationProvider(RecipeGenerationProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = build_client(api_key)
        self._model = model

    async def generate_recipes(
        self,
        ingredients: list[IngredientQuantity],
        *,
        filters: GenerationFilters | None,
        count: int,
    ) -> list[GeneratedRecipe]:
        payload = {
            "ingredients": [
                {"name": i.name, "quantity": i.quantity, "unit": i.unit} for i in ingredients
            ],
            "preferences": {
                "max_total_time_minutes": filters.max_total_time_minutes if filters else None,
                "difficulty": filters.difficulty if filters else None,
                "dietary_tags": filters.dietary_tags if filters else [],
            },
            "count": count,
        }
        result = await chat_json(
            self._client,
            model=self._model,
            # NOTE: .replace, not .format - the prompt's JSON example is full of
            # literal braces that .format would misinterpret as placeholders.
            system_prompt=_SYSTEM_PROMPT.replace("{count}", str(count)),
            user_content=json.dumps(payload),
            max_tokens=4000,
        )
        raw_recipes = result.get("recipes", [])
        if not isinstance(raw_recipes, list):
            raise AIProviderError("The AI provider returned an unexpected recipes shape.")

        try:
            return [self._parse_recipe(r) for r in raw_recipes]
        except (KeyError, TypeError, ValueError) as exc:
            raise AIProviderError(f"The AI provider returned a malformed recipe: {exc}") from exc

    @staticmethod
    def _parse_recipe(raw: dict[str, object]) -> GeneratedRecipe:
        nutrition = raw["nutrition"]
        # asserts below narrow types for mypy; a violation surfaces as an AIProviderError
        assert isinstance(nutrition, dict)
        ingredients_raw = raw["ingredients"]
        assert isinstance(ingredients_raw, list)
        steps_raw = raw["steps"]
        assert isinstance(steps_raw, list)
        substitutions_raw = raw.get("substitutions", [])
        assert isinstance(substitutions_raw, list)
        tags_raw = raw.get("tags", [])
        assert isinstance(tags_raw, list)

        return GeneratedRecipe(
            title=str(raw["title"]).strip(),
            description=str(raw.get("description", "")).strip(),
            cuisine=(str(raw["cuisine"]).strip() if raw.get("cuisine") else None),
            difficulty=str(raw.get("difficulty", "medium")).strip().lower(),
            prep_time_minutes=_as_int(raw.get("prep_time_minutes")),
            cook_time_minutes=_as_int(raw.get("cook_time_minutes")),
            servings=max(1, _as_int(raw.get("servings"), default=1)),
            ingredients=[
                GeneratedRecipeIngredient(
                    name=str(i["name"]).strip().lower(),
                    quantity=(float(i["quantity"]) if i.get("quantity") is not None else None),
                    unit=(str(i["unit"]) if i.get("unit") else None),
                    importance=_as_importance(i.get("importance")),
                    user_has=bool(i.get("user_has", False)),
                )
                for i in ingredients_raw
            ],
            steps=[str(s).strip() for s in steps_raw if str(s).strip()],
            nutrition=GeneratedNutrition(
                calories=max(0.0, float(nutrition["calories"])),
                protein_g=max(0.0, float(nutrition["protein_g"])),
                carbs_g=max(0.0, float(nutrition["carbs_g"])),
                fat_g=max(0.0, float(nutrition["fat_g"])),
                fiber_g=max(0.0, float(nutrition["fiber_g"])),
            ),
            tags=[str(t).strip().lower() for t in tags_raw if str(t).strip()],
            substitutions=[
                GeneratedSubstitution(
                    ingredient=str(s["ingredient"]).strip(),
                    substitute=str(s["substitute"]).strip(),
                    notes=str(s.get("notes", "")).strip(),
                )
                for s in substitutions_raw
            ],
            match_explanation=str(raw.get("match_explanation", "")).strip(),
        )
