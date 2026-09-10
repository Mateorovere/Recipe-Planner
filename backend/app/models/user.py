from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.recipe_search import RecipeSearch
    from app.models.saved_recipe import SavedRecipe
    from app.models.user_ingredient import UserIngredient


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    saved_recipes: Mapped[list[SavedRecipe]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    ingredient_history: Mapped[list[UserIngredient]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    searches: Mapped[list[RecipeSearch]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
