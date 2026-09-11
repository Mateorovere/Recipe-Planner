"""FastAPI dependency wiring: DB session, current user, AI providers, services.

Everything downstream (routers) depends on these functions rather than constructing
sessions/services/providers itself, so tests can override a handful of entries
(`app.dependency_overrides`) to inject fakes without touching route code.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import LLMProvider, RecipeGenerationProvider, SpeechProvider, VisionProvider
from app.ai.factory import (
    get_llm_provider,
    get_recipe_generation_provider,
    get_speech_provider,
    get_vision_provider,
)
from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError
from app.core.security import decode_access_token
from app.db.session import get_db as _get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.favorite_service import FavoriteService, HistoryService
from app.services.ingredient_service import IngredientService
from app.services.recipe_service import RecipeService


async def get_db() -> AsyncGenerator[AsyncSession]:
    async for session in _get_db():
        yield session


def get_settings_dep() -> Settings:
    return get_settings()


def get_vision_provider_dep() -> VisionProvider:
    return get_vision_provider()


def get_llm_provider_dep() -> LLMProvider:
    return get_llm_provider()


def get_speech_provider_dep() -> SpeechProvider:
    return get_speech_provider()


def get_recipe_generation_provider_dep() -> RecipeGenerationProvider:
    return get_recipe_generation_provider()


async def get_current_user_optional(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    subject = decode_access_token(token)
    if subject is None:
        return None
    try:
        user_id = int(subject)
    except ValueError:
        return None
    return await UserRepository(session).get_by_id(user_id)


async def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise AuthenticationError("Authentication required. Please log in.")
    return user


def get_ingredient_service(
    session: AsyncSession = Depends(get_db),
    vision: VisionProvider = Depends(get_vision_provider_dep),
    speech: SpeechProvider = Depends(get_speech_provider_dep),
    llm: LLMProvider = Depends(get_llm_provider_dep),
) -> IngredientService:
    return IngredientService(
        session, vision_provider=vision, speech_provider=speech, llm_provider=llm
    )


def get_recipe_service(
    session: AsyncSession = Depends(get_db),
    generation: RecipeGenerationProvider = Depends(get_recipe_generation_provider_dep),
    settings: Settings = Depends(get_settings_dep),
) -> RecipeService:
    return RecipeService(
        session,
        generation_provider=generation,
        generation_model_name=settings.openai_recipe_generation_model,
        default_count=settings.recipes_per_search,
    )


def get_favorite_service(session: AsyncSession = Depends(get_db)) -> FavoriteService:
    return FavoriteService(session)


def get_history_service(session: AsyncSession = Depends(get_db)) -> HistoryService:
    return HistoryService(session)


def get_auth_service(session: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(session)
