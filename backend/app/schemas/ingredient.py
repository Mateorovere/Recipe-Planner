from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import IngredientInputSource


class DetectedIngredient(BaseModel):
    """An ingredient found by a vision/LLM provider, before the user reviews it."""

    name: str
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    source: IngredientInputSource
    quantity: float | None = Field(default=None, gt=0)
    unit: str | None = None


class TextIngredientRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class IngredientExtractionResponse(BaseModel):
    ingredients: list[DetectedIngredient]
    transcript: str | None = None
    """Populated for the audio endpoint so the user can verify what was heard."""


class IngredientHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    raw_label: str
    source: IngredientInputSource
    confidence: float | None
    quantity: float | None
    unit: str | None
    created_at: datetime


class IngredientQuantityInput(BaseModel):
    """One ingredient the user has, as sent into recipe generation."""

    name: str = Field(min_length=1, max_length=120)
    quantity: float | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, max_length=30)
