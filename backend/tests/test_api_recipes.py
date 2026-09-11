from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.fakes import FakeRecipeGenerationProvider

pytestmark = pytest.mark.asyncio


async def test_search_recipes_returns_generated_results(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/recipes/search",
        json={"ingredients": [{"name": "egg", "quantity": 2, "unit": "unit"}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["recipes"]) == 1
    assert body["recipes"][0]["title"]
    assert body["recipes"][0]["matched_ingredient_count"] == 1


async def test_search_recipes_no_recipes_generated_returns_404(
    client: AsyncClient, fake_recipe_generation: FakeRecipeGenerationProvider
) -> None:
    fake_recipe_generation.return_empty = True
    response = await client.post("/api/v1/recipes/search", json={"ingredients": [{"name": "egg"}]})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "no_matching_recipes"


async def test_search_recipes_provider_failure_returns_502(
    client: AsyncClient, fake_recipe_generation: FakeRecipeGenerationProvider
) -> None:
    fake_recipe_generation.raise_error = True
    response = await client.post("/api/v1/recipes/search", json={"ingredients": [{"name": "egg"}]})
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "ai_provider_error"


async def test_search_recipes_validates_empty_ingredient_list(client: AsyncClient) -> None:
    response = await client.post("/api/v1/recipes/search", json={"ingredients": []})
    assert response.status_code == 422


async def test_get_recipe_detail(client: AsyncClient) -> None:
    search = await client.post("/api/v1/recipes/search", json={"ingredients": [{"name": "egg"}]})
    recipe_id = search.json()["recipes"][0]["id"]

    response = await client.get(f"/api/v1/recipes/{recipe_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == recipe_id
    assert len(body["steps"]) == 2
    assert body["nutrition"]["calories"] == 400.0


async def test_get_recipe_detail_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/recipes/999999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "recipe_not_found"


async def test_favorite_requires_auth(client: AsyncClient) -> None:
    search = await client.post("/api/v1/recipes/search", json={"ingredients": [{"name": "egg"}]})
    recipe_id = search.json()["recipes"][0]["id"]
    response = await client.post(f"/api/v1/recipes/{recipe_id}/favorite")
    assert response.status_code == 401


async def test_favorite_add_list_and_remove(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    search = await client.post(
        "/api/v1/recipes/search",
        json={"ingredients": [{"name": "egg"}]},
        headers=auth_headers,
    )
    recipe_id = search.json()["recipes"][0]["id"]

    add = await client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=auth_headers)
    assert add.status_code == 204

    listed = await client.get("/api/v1/users/me/favorites", headers=auth_headers)
    assert listed.status_code == 200
    assert [r["id"] for r in listed.json()] == [recipe_id]

    remove = await client.delete(f"/api/v1/recipes/{recipe_id}/favorite", headers=auth_headers)
    assert remove.status_code == 204

    listed_again = await client.get("/api/v1/users/me/favorites", headers=auth_headers)
    assert listed_again.json() == []


async def test_unfavorite_nonexistent_returns_404(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    search = await client.post(
        "/api/v1/recipes/search",
        json={"ingredients": [{"name": "egg"}]},
        headers=auth_headers,
    )
    recipe_id = search.json()["recipes"][0]["id"]
    response = await client.delete(f"/api/v1/recipes/{recipe_id}/favorite", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "favorite_not_found"


async def test_favorite_missing_recipe_returns_404(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    response = await client.post("/api/v1/recipes/999999/favorite", headers=auth_headers)
    assert response.status_code == 404


async def test_search_history_recorded(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    await client.post(
        "/api/v1/recipes/search",
        json={"ingredients": [{"name": "egg", "quantity": 2, "unit": "unit"}]},
        headers=auth_headers,
    )
    response = await client.get("/api/v1/users/me/history", headers=auth_headers)
    searches = response.json()["searches"]
    assert len(searches) == 1
    assert searches[0]["query_ingredients"] == [{"name": "egg", "quantity": 2, "unit": "unit"}]
