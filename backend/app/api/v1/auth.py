from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_auth_service
from app.schemas.user import Token, UserCreate, UserLogin, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate, auth_service: AuthService = Depends(get_auth_service)
) -> UserRead:
    user = await auth_service.register(
        email=payload.email, password=payload.password, full_name=payload.full_name
    )
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, auth_service: AuthService = Depends(get_auth_service)) -> Token:
    user = await auth_service.authenticate(email=payload.email, password=payload.password)
    token = auth_service.issue_token(user)
    return Token(access_token=token)
