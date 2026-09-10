"""Builds the configured AI provider instances from `Settings`.

This is the single place that knows the mapping from an env-var provider name to a
concrete class. Swapping providers is a config change here (or in `.env`); nothing
elsewhere in the codebase references a concrete provider class.
"""

from __future__ import annotations

from functools import lru_cache

from app.ai.base import LLMProvider, NutritionProvider, SpeechProvider, VisionProvider
from app.core.config import Settings, get_settings


@lru_cache
def get_vision_provider(settings: Settings | None = None) -> VisionProvider:
    settings = settings or get_settings()
    if settings.vision_provider == "openai":
        from app.ai.providers.openai_vision import OpenAIVisionProvider

        return OpenAIVisionProvider(
            api_key=settings.openai_api_key, model=settings.openai_vision_model
        )
    raise ValueError(f"Unknown vision provider: {settings.vision_provider}")


@lru_cache
def get_llm_provider(settings: Settings | None = None) -> LLMProvider:
    settings = settings or get_settings()
    if settings.llm_provider == "openai":
        from app.ai.providers.openai_llm import OpenAILLMProvider

        return OpenAILLMProvider(api_key=settings.openai_api_key, model=settings.openai_llm_model)
    raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")


@lru_cache
def get_speech_provider(settings: Settings | None = None) -> SpeechProvider:
    settings = settings or get_settings()
    if settings.speech_provider == "local_whisper":
        from app.ai.providers.local_whisper_speech import LocalWhisperSpeechProvider

        return LocalWhisperSpeechProvider(
            model_size=settings.whisper_model_size,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
    if settings.speech_provider == "openai":
        from app.ai.providers.openai_speech import OpenAISpeechProvider

        return OpenAISpeechProvider(api_key=settings.openai_api_key)
    raise ValueError(f"Unknown speech provider: {settings.speech_provider}")


@lru_cache
def get_nutrition_provider(settings: Settings | None = None) -> NutritionProvider:
    settings = settings or get_settings()
    if settings.nutrition_provider == "openai":
        from app.ai.providers.openai_nutrition import OpenAINutritionProvider

        return OpenAINutritionProvider(
            api_key=settings.openai_api_key, model=settings.openai_nutrition_model
        )
    raise ValueError(f"Unknown nutrition provider: {settings.nutrition_provider}")
