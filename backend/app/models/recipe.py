from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import Difficulty

if TYPE_CHECKING:
    from app.models.nutrition import NutritionInformation
    from app.models.recipe_ingredient import RecipeIngredient


class Recipe(TimestampMixin, Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    prep_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    cook_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, native_enum=False, length=20), nullable=False, index=True
    )
    servings: Mapped[int] = mapped_column(Integer, nullable=False)
    cuisine: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source: Mapped[str | None] = mapped_column(String(200), nullable=True)
    """Provenance, e.g. 'ai_generated:gpt-4o-mini'."""
    match_explanation: Mapped[str] = mapped_column(Text, default="", nullable=False)
    substitutions: Mapped[list[dict[str, str]] | None] = mapped_column(JSON, nullable=True)
    """Free-text substitution suggestions: [{"ingredient", "substitute", "notes"}, ...]."""

    steps: Mapped[list[RecipeStep]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeStep.step_number"
    )
    recipe_ingredients: Mapped[list[RecipeIngredient]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )
    tags: Mapped[list[RecipeTag]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )
    nutrition: Mapped[NutritionInformation | None] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", uselist=False
    )

    @property
    def total_time_minutes(self) -> int:
        return self.prep_time_minutes + self.cook_time_minutes


class RecipeStep(Base):
    __tablename__ = "recipe_steps"
    __table_args__ = (UniqueConstraint("recipe_id", "step_number", name="uq_recipe_step_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), index=True, nullable=False
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)

    recipe: Mapped[Recipe] = relationship(back_populates="steps")


class RecipeTag(Base):
    """Free-form tags used for category/dietary filtering (vegetarian, quick, dessert, ...)."""

    __tablename__ = "recipe_tags"
    __table_args__ = (UniqueConstraint("recipe_id", "tag", name="uq_recipe_tag"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tag: Mapped[str] = mapped_column(String(60), index=True, nullable=False)

    recipe: Mapped[Recipe] = relationship(back_populates="tags")
