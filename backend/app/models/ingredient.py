from __future__ import annotations

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Ingredient(TimestampMixin, Base):
    """Canonical ingredient dictionary used for normalization and matching.

    Grows organically: besides the seeded starter set, new canonical ingredients
    are created on the fly whenever an AI-generated recipe introduces a name that
    isn't in the dictionary yet (see `IngredientRepository.get_or_create`).
    """

    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    category: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)

    aliases: Mapped[list[IngredientAlias]] = relationship(
        back_populates="ingredient", cascade="all, delete-orphan"
    )


class IngredientAlias(Base):
    """Alternate names/spellings that normalize to a canonical ingredient."""

    __tablename__ = "ingredient_aliases"
    __table_args__ = (UniqueConstraint("alias", name="uq_ingredient_alias"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"), index=True, nullable=False
    )
    alias: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    ingredient: Mapped[Ingredient] = relationship(back_populates="aliases")
