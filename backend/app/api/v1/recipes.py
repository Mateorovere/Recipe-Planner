from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_current_user,
    get_current_user_optional,
    get_favorite_service,
    get_recipe_service,
)
from app.models.user import User
from app.schemas.recipe import RecipeDetail, RecipeSearchRequest, RecipeSearchResponse
from app.services.favorite_service import FavoriteService
from app.services.recipe_service import RecipeService

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/search", response_model=RecipeSearchResponse)
async def search_recipes(
    payload: RecipeSearchRequest,
    service: RecipeService = Depends(get_recipe_service),
    user: User | None = Depends(get_current_user_optional),
) -> RecipeSearchResponse:
    return await service.search(
        payload.ingredients,
        filters=payload.filters,
        limit=payload.limit,
        user_id=user.id if user else None,
    )


@router.get("/{recipe_id}", response_model=RecipeDetail)
async def get_recipe(
    recipe_id: int,
    ingredients: list[str] = Query(default_factory=list),
    service: RecipeService = Depends(get_recipe_service),
    user: User | None = Depends(get_current_user_optional),
) -> RecipeDetail:
    return await service.get_detail(
        recipe_id, raw_ingredients=ingredients, user_id=user.id if user else None
    )


@router.post("/{recipe_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def favorite_recipe(
    recipe_id: int,
    service: FavoriteService = Depends(get_favorite_service),
    user: User = Depends(get_current_user),
) -> None:
    await service.add(user.id, recipe_id)


@router.delete("/{recipe_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_recipe(
    recipe_id: int,
    service: FavoriteService = Depends(get_favorite_service),
    user: User = Depends(get_current_user),
) -> None:
    await service.remove(user.id, recipe_id)
