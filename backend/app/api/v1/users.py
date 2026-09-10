from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_favorite_service, get_history_service
from app.models.user import User
from app.schemas.ingredient import IngredientHistoryItem
from app.schemas.recipe import RecipeSummary, SearchHistoryItem
from app.schemas.user import UserRead
from app.services.favorite_service import FavoriteService, HistoryService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_me(user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(user)


@router.get("/me/favorites", response_model=list[RecipeSummary])
async def read_favorites(
    user: User = Depends(get_current_user),
    service: FavoriteService = Depends(get_favorite_service),
) -> list[RecipeSummary]:
    return await service.list_for_user(user.id)


@router.get("/me/history")
async def read_history(
    user: User = Depends(get_current_user),
    service: HistoryService = Depends(get_history_service),
) -> dict[str, list[SearchHistoryItem] | list[IngredientHistoryItem]]:
    return {
        "searches": await service.get_search_history(user.id),
        "ingredients": await service.get_ingredient_history(user.id),
    }
