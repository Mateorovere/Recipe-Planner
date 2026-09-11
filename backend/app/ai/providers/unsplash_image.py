"""Unsplash-backed image search: recipe title -> a relevant food photo.

Unsplash's API terms (https://help.unsplash.com/en/articles/2511315) require
that a used photo (a) is hotlinked rather than rehosted — we store and serve
the `regular` URL directly, never download/re-upload it — (b) triggers a
request to the photo's `download_location` at the moment it's put to use, and
(c) is credited with a link to the photographer and to Unsplash, both carrying
UTM parameters. This module handles (a) and (b) itself and returns everything
the caller needs to render (c).
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.ai.base import ImageProvider
from app.ai.types import ImageResult

logger = logging.getLogger(__name__)

_SEARCH_URL = "https://api.unsplash.com/search/photos"
_APP_NAME = "ai-recipe-planner"
_TIMEOUT_SECONDS = 8.0


class UnsplashImageProvider(ImageProvider):
    def __init__(self, access_key: str) -> None:
        self._access_key = access_key

    async def find_image(self, query: str) -> ImageResult | None:
        # No key configured — images are an optional feature, so just skip
        # them rather than treating this as an error.
        if not self._access_key:
            return None

        headers = {"Authorization": f"Client-ID {self._access_key}"}
        params = {
            "query": query,
            "per_page": "1",
            "orientation": "landscape",
            "content_filter": "high",
        }
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
                response = await client.get(_SEARCH_URL, headers=headers, params=params)
                response.raise_for_status()
                results = response.json()["results"]
                if not results:
                    return None
                photo = results[0]

                await self._ping_download(client, headers, photo)

                return ImageResult(
                    url=photo["urls"]["regular"],
                    photographer_name=photo["user"]["name"],
                    photographer_url=(
                        f"{photo['user']['links']['html']}"
                        f"?utm_source={_APP_NAME}&utm_medium=referral"
                    ),
                )
        except (httpx.HTTPError, KeyError, ValueError, IndexError):
            logger.warning("Unsplash image search failed for query %r", query, exc_info=True)
            return None

    @staticmethod
    async def _ping_download(
        client: httpx.AsyncClient, headers: dict[str, str], photo: dict[str, Any]
    ) -> None:
        """Required by Unsplash's guidelines whenever a photo is used — this is
        best-effort and never blocks image selection if it fails."""
        download_location = photo.get("links", {}).get("download_location")
        if not download_location:
            return
        try:
            await client.get(download_location, headers=headers)
        except httpx.HTTPError:
            logger.warning("Unsplash download-tracking ping failed", exc_info=True)
