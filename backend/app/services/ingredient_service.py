"""Orchestrates the image / audio / text -> structured ingredients workflows.

Each `detect_from_*` method is thin: call the right AI provider(s), normalize the
result to canonical ingredients where possible, optionally persist history, and
return API-ready `DetectedIngredient` schemas. Low-confidence or empty results raise
typed errors rather than silently returning nothing, per the spec's reliability
requirements.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import LLMProvider, SpeechProvider, VisionProvider
from app.ai.types import RawDetectedIngredient
from app.core.exceptions import NoIngredientsDetectedError, UnsupportedMediaError
from app.models.enums import IngredientInputSource
from app.repositories.user_ingredient_repository import (
    UserIngredientRecord,
    UserIngredientRepository,
)
from app.schemas.ingredient import DetectedIngredient, IngredientExtractionResponse
from app.services.ingredient_normalization import IngredientNormalizer

_SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
_SUPPORTED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/m4a",
    "audio/mp4",
}


class IngredientService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        vision_provider: VisionProvider,
        speech_provider: SpeechProvider,
        llm_provider: LLMProvider,
    ) -> None:
        self._session = session
        self._vision = vision_provider
        self._speech = speech_provider
        self._llm = llm_provider
        self._normalizer = IngredientNormalizer(session)
        self._history = UserIngredientRepository(session)

    async def detect_from_image(
        self, image_bytes: bytes, mime_type: str, *, user_id: int | None
    ) -> IngredientExtractionResponse:
        if mime_type not in _SUPPORTED_IMAGE_TYPES:
            raise UnsupportedMediaError(
                f"Unsupported image type '{mime_type}'. Supported: "
                f"{', '.join(sorted(_SUPPORTED_IMAGE_TYPES))}."
            )
        detected = await self._vision.detect_ingredients(image_bytes, mime_type)
        return await self._finalize(detected, source=IngredientInputSource.IMAGE, user_id=user_id)

    async def detect_from_audio(
        self, audio_bytes: bytes, mime_type: str, *, user_id: int | None
    ) -> IngredientExtractionResponse:
        if mime_type not in _SUPPORTED_AUDIO_TYPES:
            raise UnsupportedMediaError(
                f"Unsupported audio type '{mime_type}'. Supported: "
                f"{', '.join(sorted(_SUPPORTED_AUDIO_TYPES))}."
            )
        transcript = await self._speech.transcribe(audio_bytes, mime_type)
        if not transcript.strip():
            raise NoIngredientsDetectedError(
                "We couldn't hear any speech in that recording. Please try again."
            )
        detected = await self._llm.extract_ingredients(transcript)
        response = await self._finalize(
            detected, source=IngredientInputSource.AUDIO, user_id=user_id
        )
        response.transcript = transcript
        return response

    async def detect_from_text(
        self, text: str, *, user_id: int | None
    ) -> IngredientExtractionResponse:
        detected = await self._llm.extract_ingredients(text)
        return await self._finalize(detected, source=IngredientInputSource.TEXT, user_id=user_id)

    async def _finalize(
        self,
        detected: list[RawDetectedIngredient],
        *,
        source: IngredientInputSource,
        user_id: int | None,
    ) -> IngredientExtractionResponse:
        if not detected:
            raise NoIngredientsDetectedError(
                "No ingredients could be identified. Try a clearer photo, a closer "
                "recording, or type them in manually."
            )

        # De-duplicate by name, keeping the highest confidence.
        best_by_name: dict[str, RawDetectedIngredient] = {}
        for item in detected:
            existing = best_by_name.get(item.name)
            if existing is None or (item.confidence or 0) > (existing.confidence or 0):
                best_by_name[item.name] = item
        deduped = list(best_by_name.values())

        if user_id is not None:
            normalized = await self._normalizer.normalize_many([d.name for d in deduped])
            by_raw = {n.raw_name: n for n in normalized}
            history_items: list[UserIngredientRecord] = []
            for item in deduped:
                matched = by_raw[item.name].ingredient
                history_items.append(
                    UserIngredientRecord(
                        raw_label=item.name,
                        ingredient_id=matched.id if matched else None,
                        confidence=item.confidence,
                        quantity=item.quantity,
                        unit=item.unit,
                    )
                )
            await self._history.record_many(user_id=user_id, source=source, items=history_items)
            await self._session.commit()

        return IngredientExtractionResponse(
            ingredients=[
                DetectedIngredient(
                    name=item.name,
                    confidence=item.confidence,
                    source=source,
                    quantity=item.quantity,
                    unit=item.unit,
                )
                for item in deduped
            ]
        )
