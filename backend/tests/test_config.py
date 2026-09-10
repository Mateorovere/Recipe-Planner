from __future__ import annotations

import pytest

from app.core.config import Settings


def test_missing_secret_key_fails_fast_in_production_env() -> None:
    with pytest.raises(ValueError, match="SECRET_KEY"):
        Settings(ENVIRONMENT="production", SECRET_KEY="", OPENAI_API_KEY="x")


def test_missing_openai_key_fails_fast_when_provider_is_openai() -> None:
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="secret",
            OPENAI_API_KEY="",
            VISION_PROVIDER="openai",
        )


def test_test_environment_skips_secret_validation() -> None:
    settings = Settings(ENVIRONMENT="test", SECRET_KEY="", OPENAI_API_KEY="")
    assert settings.environment == "test"


def test_valid_settings_construct_successfully() -> None:
    settings = Settings(ENVIRONMENT="production", SECRET_KEY="secret", OPENAI_API_KEY="sk-x")
    assert settings.secret_key == "secret"
