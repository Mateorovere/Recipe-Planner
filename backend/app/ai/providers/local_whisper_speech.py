from __future__ import annotations

import asyncio
import logging
import tempfile
from pathlib import Path

from app.ai.base import SpeechProvider
from app.core.exceptions import AIProviderError

logger = logging.getLogger(__name__)

# faster-whisper's WhisperModel is expensive to construct (loads model weights), so
# each distinct (size, device, compute_type) combination is built once and reused.
_model_cache: dict[tuple[str, str, str], object] = {}


def _get_model(model_size: str, device: str, compute_type: str) -> object:
    key = (model_size, device, compute_type)
    if key not in _model_cache:
        from faster_whisper import WhisperModel  # imported lazily: heavy import

        logger.info("Loading local Whisper model %s (%s/%s)", model_size, device, compute_type)
        _model_cache[key] = WhisperModel(model_size, device=device, compute_type=compute_type)
    return _model_cache[key]


class LocalWhisperSpeechProvider(SpeechProvider):
    def __init__(self, *, model_size: str, device: str, compute_type: str) -> None:
        self._model_size = model_size
        self._device = device
        self._compute_type = compute_type

    async def transcribe(self, audio_bytes: bytes, mime_type: str) -> str:
        try:
            return await asyncio.to_thread(self._transcribe_sync, audio_bytes)
        except AIProviderError:
            raise
        except Exception as exc:  # noqa: BLE001 - normalize any decode/model failure
            raise AIProviderError(f"Local speech transcription failed: {exc}") from exc

    def _transcribe_sync(self, audio_bytes: bytes) -> str:
        model = _get_model(self._model_size, self._device, self._compute_type)
        with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = Path(tmp.name)
        try:
            segments, _info = model.transcribe(str(tmp_path), beam_size=1)  # type: ignore[attr-defined]
            transcript = " ".join(segment.text.strip() for segment in segments).strip()
            return transcript
        finally:
            tmp_path.unlink(missing_ok=True)
