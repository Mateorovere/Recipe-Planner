"""Import every model so `Base.metadata` is fully populated for Alembic
autogenerate and for `Base.metadata.create_all` in tests."""

from app.models.ingredient import Ingredient, IngredientAlias, IngredientSubstitution
from app.models.nutrition import NutritionInformation
from app.models.recipe import Recipe, RecipeStep, RecipeTag
from app.models.recipe_ingredient import RecipeIngredient
from app.models.recipe_search import RecipeSearch
from app.models.saved_recipe import SavedRecipe
from app.models.user import User
from app.models.user_ingredient import UserIngredient

__all__ = [
    "Ingredient",
    "IngredientAlias",
    "IngredientSubstitution",
    "NutritionInformation",
    "Recipe",
    "RecipeStep",
    "RecipeTag",
    "RecipeIngredient",
    "RecipeSearch",
    "SavedRecipe",
    "User",
    "UserIngredient",
]
