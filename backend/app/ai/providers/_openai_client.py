"""Shared helpers for the OpenAI-backed providers."""

from __future__ import annotations

import json
import logging
from typing import Any

import openai
from openai import AsyncOpenAI

from app.core.exceptions import AIProviderError, AIRateLimitError

logger = logging.getLogger(__name__)


def build_client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key)


async def chat_json(
    client: AsyncOpenAI,
    *,
    model: str,
    system_prompt: str,
    user_content: str | list[dict[str, Any]],
    max_tokens: int = 1000,
) -> dict[str, Any]:
    """Call the chat completions API in JSON mode and parse the result.

    Any transport/API failure is normalized into `AIProviderError` (or
    `AIRateLimitError` for 429s) so callers never have to know about the OpenAI SDK's
    own exception hierarchy.
    """
    messages: list[Any] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=max_tokens,
            temperature=0.2,
        )
    except openai.RateLimitError as exc:
        raise AIRateLimitError("The AI provider is rate-limiting requests.") from exc
    except openai.APITimeoutError as exc:
        raise AIProviderError("The AI provider timed out.") from exc
    except openai.APIError as exc:
        raise AIProviderError(f"The AI provider returned an error: {exc}") from exc

    content = response.choices[0].message.content
    if not content:
        raise AIProviderError("The AI provider returned an empty response.")
    try:
        parsed: dict[str, Any] = json.loads(content)
    except json.JSONDecodeError as exc:
        raise AIProviderError("The AI provider returned a malformed response.") from exc
    return parsed
