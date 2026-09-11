from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.ai.types import RawDetectedIngredient
from tests.fakes import FakeLLMProvider, FakeSpeechProvider, FakeVisionProvider

pytestmark = pytest.mark.asyncio


async def test_text_ingredients_extraction(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/ingredients/text",
        json={"text": "I have chicken, rice, broccoli and soy sauce."},
    )
    assert response.status_code == 200
    names = {i["name"] for i in response.json()["ingredients"]}
    assert names == {"chicken", "rice", "broccoli", "soy sauce"}
    assert all(i["source"] == "text" for i in response.json()["ingredients"])


async def test_text_ingredients_empty_text_is_rejected(client: AsyncClient) -> None:
    response = await client.post("/api/v1/ingredients/text", json={"text": ""})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_text_ingredients_no_ingredients_detected(
    client: AsyncClient, fake_llm: FakeLLMProvider
) -> None:
    fake_llm.forced_ingredients = []
    response = await client.post("/api/v1/ingredients/text", json={"text": "hello there"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "no_ingredients_detected"


async def test_image_ingredients_extraction(client: AsyncClient) -> None:
    files = {"file": ("photo.jpg", b"fake-image-bytes", "image/jpeg")}
    response = await client.post("/api/v1/ingredients/image", files=files)
    assert response.status_code == 200
    names = {i["name"] for i in response.json()["ingredients"]}
    assert names == {"tomato", "egg", "onion"}


async def test_image_unsupported_media_type_rejected(client: AsyncClient) -> None:
    files = {"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")}
    response = await client.post("/api/v1/ingredients/image", files=files)
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "unsupported_media"


async def test_image_empty_file_rejected(client: AsyncClient) -> None:
    files = {"file": ("photo.jpg", b"", "image/jpeg")}
    response = await client.post("/api/v1/ingredients/image", files=files)
    assert response.status_code == 415


async def test_audio_ingredients_extraction_includes_transcript(client: AsyncClient) -> None:
    files = {"file": ("clip.wav", b"fake-audio-bytes", "audio/wav")}
    response = await client.post("/api/v1/ingredients/audio", files=files)
    assert response.status_code == 200
    body = response.json()
    assert body["transcript"] == "I have chicken, rice, onions and garlic."
    names = {i["name"] for i in body["ingredients"]}
    assert "chicken" in names
    assert "rice" in names


async def test_audio_unsupported_format_rejected(client: AsyncClient) -> None:
    files = {"file": ("clip.xyz", b"fake-audio-bytes", "audio/unknown")}
    response = await client.post("/api/v1/ingredients/audio", files=files)
    assert response.status_code == 415


async def test_audio_empty_transcript_raises_no_ingredients(
    client: AsyncClient, fake_speech: FakeSpeechProvider
) -> None:
    fake_speech.transcript = "   "
    files = {"file": ("clip.wav", b"fake-audio-bytes", "audio/wav")}
    response = await client.post("/api/v1/ingredients/audio", files=files)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "no_ingredients_detected"


async def test_low_confidence_detections_are_still_returned(
    client: AsyncClient, fake_vision: FakeVisionProvider
) -> None:
    fake_vision.ingredients = [RawDetectedIngredient(name="mystery-item", confidence=0.2)]
    files = {"file": ("photo.jpg", b"fake-image-bytes", "image/jpeg")}
    response = await client.post("/api/v1/ingredients/image", files=files)
    assert response.status_code == 200
    body = response.json()["ingredients"]
    assert body[0]["name"] == "mystery-item"
    assert body[0]["confidence"] == pytest.approx(0.2)


async def test_detected_quantity_and_unit_are_passed_through(
    client: AsyncClient, fake_llm: FakeLLMProvider
) -> None:
    fake_llm.forced_ingredients = [
        RawDetectedIngredient(name="egg", confidence=0.9, quantity=2, unit="unit")
    ]
    response = await client.post("/api/v1/ingredients/text", json={"text": "I have 2 eggs"})
    assert response.status_code == 200
    ingredient = response.json()["ingredients"][0]
    assert ingredient["quantity"] == 2
    assert ingredient["unit"] == "unit"


async def test_ingredient_history_recorded_for_authenticated_user(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    await client.post(
        "/api/v1/ingredients/text",
        json={"text": "I have chicken and rice."},
        headers=auth_headers,
    )
    response = await client.get("/api/v1/users/me/history", headers=auth_headers)
    assert response.status_code == 200
    history = response.json()["ingredients"]
    assert {h["raw_label"] for h in history} == {"chicken", "rice"}
