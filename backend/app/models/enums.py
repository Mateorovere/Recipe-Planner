"""Shared enum types used across models and schemas."""

from __future__ import annotations

import enum


class Difficulty(enum.StrEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class IngredientImportance(enum.StrEnum):
    CRITICAL = "critical"
    NORMAL = "normal"
    OPTIONAL = "optional"


class NutritionSource(enum.StrEnum):
    CALCULATED = "calculated"
    ESTIMATED = "estimated"
    DATABASE = "database"
    AI_GENERATED = "ai_generated"


class IngredientInputSource(enum.StrEnum):
    IMAGE = "image"
    AUDIO = "audio"
    TEXT = "text"
    MANUAL = "manual"
