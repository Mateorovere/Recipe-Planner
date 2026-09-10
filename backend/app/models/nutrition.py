from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import NutritionSource

if TYPE_CHECKING:
    from app.models.recipe import Recipe


class NutritionInformation(TimestampMixin, Base):
    """Nutrition is always attributed to a `source` so the UI can label it honestly
    (never presented as medically precise when it's AI-estimated)."""

    __tablename__ = "nutrition_information"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False)
    fiber_g: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[NutritionSource] = mapped_column(
        Enum(NutritionSource, native_enum=False, length=20), nullable=False
    )

    recipe: Mapped[Recipe] = relationship(back_populates="nutrition")
