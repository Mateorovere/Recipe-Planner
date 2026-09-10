from __future__ import annotations

import io

import openai

from app.ai.base import SpeechProvider
from app.ai.providers._openai_client import build_client
from app.core.exceptions import AIProviderError, AIRateLimitError

_EXT_BY_MIME = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "mp4",
}


class OpenAISpeechProvider(SpeechProvider):
    """Alternative to the local Whisper provider — cloud STT via OpenAI's API.

    Selected with `SPEECH_PROVIDER=openai` (requires `OPENAI_API_KEY`).
    """

    def __init__(self, *, api_key: str, model: str = "whisper-1") -> None:
        self._client = build_client(api_key)
        self._model = model

    async def transcribe(self, audio_bytes: bytes, mime_type: str) -> str:
        ext = _EXT_BY_MIME.get(mime_type, "webm")
        buffer = io.BytesIO(audio_bytes)
        buffer.name = f"audio.{ext}"
        try:
            transcript = await self._client.audio.transcriptions.create(
                model=self._model, file=buffer
            )
        except openai.RateLimitError as exc:
            raise AIRateLimitError("The AI provider is rate-limiting requests.") from exc
        except openai.APIError as exc:
            raise AIProviderError(f"Speech transcription failed: {exc}") from exc
        return transcript.text.strip()
