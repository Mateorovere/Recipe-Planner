from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile

from app.api.deps import get_current_user_optional, get_ingredient_service
from app.core.exceptions import UnsupportedMediaError
from app.models.user import User
from app.schemas.ingredient import IngredientExtractionResponse, TextIngredientRequest
from app.services.ingredient_service import IngredientService

router = APIRouter(prefix="/ingredients", tags=["ingredients"])

_MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB


async def _read_upload(file: UploadFile) -> bytes:
    data = await file.read()
    if len(data) > _MAX_UPLOAD_BYTES:
        raise UnsupportedMediaError("File is too large (max 15 MB).")
    if not data:
        raise UnsupportedMediaError("The uploaded file is empty.")
    return data


@router.post("/image", response_model=IngredientExtractionResponse)
async def detect_from_image(
    file: UploadFile,
    service: IngredientService = Depends(get_ingredient_service),
    user: User | None = Depends(get_current_user_optional),
) -> IngredientExtractionResponse:
    data = await _read_upload(file)
    mime_type = file.content_type or "application/octet-stream"
    return await service.detect_from_image(data, mime_type, user_id=user.id if user else None)


@router.post("/audio", response_model=IngredientExtractionResponse)
async def detect_from_audio(
    file: UploadFile,
    service: IngredientService = Depends(get_ingredient_service),
    user: User | None = Depends(get_current_user_optional),
) -> IngredientExtractionResponse:
    data = await _read_upload(file)
    mime_type = file.content_type or "application/octet-stream"
    return await service.detect_from_audio(data, mime_type, user_id=user.id if user else None)


@router.post("/text", response_model=IngredientExtractionResponse)
async def detect_from_text(
    payload: TextIngredientRequest,
    service: IngredientService = Depends(get_ingredient_service),
    user: User | None = Depends(get_current_user_optional),
) -> IngredientExtractionResponse:
    return await service.detect_from_text(payload.text, user_id=user.id if user else None)
