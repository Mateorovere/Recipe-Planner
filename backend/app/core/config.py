"""Application configuration.

All external services and secrets are configured exclusively through environment
variables (see `.env.example` at the repo root). Settings validate eagerly at
process startup so misconfiguration fails fast and loudly instead of surfacing as
a confusing runtime error deep in a request.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

VisionProviderName = Literal["openai"]
LLMProviderName = Literal["openai"]
SpeechProviderName = Literal["local_whisper", "openai"]
NutritionProviderName = Literal["openai"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- General ---
    environment: Literal["development", "test", "production"] = Field(
        default="development", validation_alias="ENVIRONMENT"
    )
    api_v1_prefix: str = "/api/v1"
    project_name: str = "AI Recipe Planner"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"],
        validation_alias="CORS_ORIGINS",
    )

    # --- Database ---
    database_url: str = Field(
        default="postgresql+asyncpg://recipe_ai:recipe_ai@localhost:5432/recipe_ai",
        validation_alias="DATABASE_URL",
    )

    # --- Auth ---
    secret_key: str = Field(default="", validation_alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(
        default=60 * 24, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    jwt_algorithm: str = "HS256"

    # --- AI provider selection (each layer is independently swappable) ---
    vision_provider: VisionProviderName = Field(
        default="openai", validation_alias="VISION_PROVIDER"
    )
    llm_provider: LLMProviderName = Field(default="openai", validation_alias="LLM_PROVIDER")
    speech_provider: SpeechProviderName = Field(
        default="local_whisper", validation_alias="SPEECH_PROVIDER"
    )
    nutrition_provider: NutritionProviderName = Field(
        default="openai", validation_alias="NUTRITION_PROVIDER"
    )
    ai_rerank_enabled: bool = Field(default=True, validation_alias="AI_RERANK_ENABLED")

    # --- OpenAI ---
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    openai_vision_model: str = Field(default="gpt-4o-mini", validation_alias="OPENAI_VISION_MODEL")
    openai_llm_model: str = Field(default="gpt-4o-mini", validation_alias="OPENAI_LLM_MODEL")
    openai_nutrition_model: str = Field(
        default="gpt-4o-mini", validation_alias="OPENAI_NUTRITION_MODEL"
    )

    # --- Local Whisper (speech-to-text) ---
    whisper_model_size: str = Field(default="base", validation_alias="WHISPER_MODEL_SIZE")
    whisper_device: str = Field(default="cpu", validation_alias="WHISPER_DEVICE")
    whisper_compute_type: str = Field(default="int8", validation_alias="WHISPER_COMPUTE_TYPE")

    # --- Recipe retrieval ---
    recipe_search_top_n: int = Field(default=10, validation_alias="RECIPE_SEARCH_TOP_N")

    @model_validator(mode="after")
    def _validate_required_secrets(self) -> Settings:
        # Keep tests/imports (e.g. `alembic` autogenerate, docs tooling) from
        # exploding on missing secrets; only enforce in real runtime environments.
        if self.environment == "test":
            return self

        if not self.secret_key:
            raise ValueError(
                "SECRET_KEY is required (used to sign JWTs). Set it in your .env file."
            )

        uses_openai = "openai" in (
            self.vision_provider,
            self.llm_provider,
            self.nutrition_provider,
            self.speech_provider,
        )
        if uses_openai and not self.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY is required because at least one AI provider is set to "
                "'openai'. Set it in your .env file, or switch that provider."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
