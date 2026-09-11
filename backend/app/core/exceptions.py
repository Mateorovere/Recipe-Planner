"""Typed application exceptions.

Every exception here carries an HTTP status and a stable machine-readable `code`.
`app.main` registers a single handler that turns any of these into
`{"error": {"code": ..., "message": ...}}` and turns everything else (a bug) into a
generic 500 without leaking internals.
"""

from __future__ import annotations


class AppError(Exception):
    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class AuthenticationError(AppError):
    status_code = 401
    code = "authentication_error"


class NoIngredientsDetectedError(AppError):
    status_code = 422
    code = "no_ingredients_detected"


class UnsupportedMediaError(AppError):
    status_code = 415
    code = "unsupported_media"


class NoMatchingRecipesError(AppError):
    status_code = 404
    code = "no_matching_recipes"


class AIProviderError(AppError):
    """Raised whenever an upstream AI/service call fails or times out."""

    status_code = 502
    code = "ai_provider_error"


class AIRateLimitError(AIProviderError):
    status_code = 429
    code = "ai_rate_limited"
