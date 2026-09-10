from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import IngredientInputSource

if TYPE_CHECKING:
    from app.models.ingredient import Ingredient
    from app.models.user import User


class UserIngredient(Base):
    """A single detected/entered ingredient, kept as history for the user."""

    __tablename__ = "user_ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    ingredient_id: Mapped[int | None] = mapped_column(
        ForeignKey("ingredients.id", ondelete="SET NULL"), index=True, nullable=True
    )
    raw_label: Mapped[str] = mapped_column(String(120), nullable=False)
    source: Mapped[IngredientInputSource] = mapped_column(
        Enum(IngredientInputSource, native_enum=False, length=20), nullable=False
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="ingredient_history")
    ingredient: Mapped[Ingredient | None] = relationship()
