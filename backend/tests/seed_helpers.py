"""Minimal, hand-built fixtures for tests that need real rows in the DB
(distinct from the full production seed data in `app/db/seed.py`)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Difficulty, IngredientImportance, NutritionSource
from app.models.ingredient import Ingredient
from app.models.nutrition import NutritionInformation
from app.models.recipe import Recipe, RecipeStep, RecipeTag
from app.models.recipe_ingredient import RecipeIngredient


async def seed_basic_recipes(session: AsyncSession) -> dict[str, Recipe]:
    names = [
        "tomato",
        "egg",
        "onion",
        "cheese",
        "chicken",
        "rice",
        "garlic",
        "broccoli",
        "soy sauce",
    ]
    ingredients = {name: Ingredient(name=name, category="produce") for name in names}
    session.add_all(ingredients.values())
    await session.flush()

    # Recipe 1: needs tomato, egg, onion, cheese (critical) -- great match for the
    # default FakeVisionProvider output.
    omelette = Recipe(
        title="Tomato Cheese Omelette",
        slug="tomato-cheese-omelette",
        description="A quick, cheesy omelette.",
        image_url=None,
        prep_time_minutes=5,
        cook_time_minutes=10,
        difficulty=Difficulty.EASY,
        servings=2,
        cuisine="American",
    )
    session.add(omelette)
    await session.flush()
    session.add_all(
        [
            RecipeStep(recipe_id=omelette.id, step_number=1, instruction="Whisk the eggs."),
            RecipeStep(recipe_id=omelette.id, step_number=2, instruction="Cook with fillings."),
        ]
    )
    session.add_all(
        [
            RecipeIngredient(
                recipe_id=omelette.id,
                ingredient_id=ingredients["egg"].id,
                quantity=3,
                unit="unit",
                importance=IngredientImportance.CRITICAL,
            ),
            RecipeIngredient(
                recipe_id=omelette.id,
                ingredient_id=ingredients["tomato"].id,
                quantity=1,
                unit="unit",
                importance=IngredientImportance.NORMAL,
            ),
            RecipeIngredient(
                recipe_id=omelette.id,
                ingredient_id=ingredients["onion"].id,
                quantity=0.5,
                unit="unit",
                importance=IngredientImportance.NORMAL,
            ),
            RecipeIngredient(
                recipe_id=omelette.id,
                ingredient_id=ingredients["cheese"].id,
                quantity=30,
                unit="g",
                importance=IngredientImportance.OPTIONAL,
            ),
        ]
    )
    session.add(RecipeTag(recipe_id=omelette.id, tag="breakfast"))
    session.add(RecipeTag(recipe_id=omelette.id, tag="vegetarian"))
    session.add(
        NutritionInformation(
            recipe_id=omelette.id,
            calories=320,
            protein_g=22,
            carbs_g=8,
            fat_g=21,
            fiber_g=2,
            source=NutritionSource.CALCULATED,
        )
    )

    # Recipe 2: chicken fried rice -- needs many ingredients the omelette doesn't
    # have, to prove ranking distinguishes better/worse matches.
    fried_rice = Recipe(
        title="Chicken Fried Rice",
        slug="chicken-fried-rice",
        description="Classic weeknight fried rice.",
        image_url=None,
        prep_time_minutes=10,
        cook_time_minutes=15,
        difficulty=Difficulty.EASY,
        servings=4,
        cuisine="Asian",
    )
    session.add(fried_rice)
    await session.flush()
    session.add(RecipeStep(recipe_id=fried_rice.id, step_number=1, instruction="Cook rice."))
    session.add_all(
        [
            RecipeIngredient(
                recipe_id=fried_rice.id,
                ingredient_id=ingredients["chicken"].id,
                quantity=200,
                unit="g",
                importance=IngredientImportance.CRITICAL,
            ),
            RecipeIngredient(
                recipe_id=fried_rice.id,
                ingredient_id=ingredients["rice"].id,
                quantity=2,
                unit="cup",
                importance=IngredientImportance.CRITICAL,
            ),
            RecipeIngredient(
                recipe_id=fried_rice.id,
                ingredient_id=ingredients["onion"].id,
                quantity=1,
                unit="unit",
                importance=IngredientImportance.NORMAL,
            ),
            RecipeIngredient(
                recipe_id=fried_rice.id,
                ingredient_id=ingredients["garlic"].id,
                quantity=2,
                unit="clove",
                importance=IngredientImportance.NORMAL,
            ),
            RecipeIngredient(
                recipe_id=fried_rice.id,
                ingredient_id=ingredients["soy sauce"].id,
                quantity=2,
                unit="tbsp",
                importance=IngredientImportance.NORMAL,
            ),
        ]
    )
    session.add(RecipeTag(recipe_id=fried_rice.id, tag="dinner"))
    session.add(RecipeTag(recipe_id=fried_rice.id, tag="quick"))

    await session.commit()
    return {"omelette": omelette, "fried_rice": fried_rice}
