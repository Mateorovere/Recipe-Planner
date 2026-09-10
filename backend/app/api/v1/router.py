from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, ingredients, recipes, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(ingredients.router)
api_router.include_router(recipes.router)
api_router.include_router(users.router)
