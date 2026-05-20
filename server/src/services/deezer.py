from typing import Optional
from clients.deezer.client import DeezerClient
from cache.repositories.deezer import DeezerCache, NO_PREVIEW


class DeezerService:
    def __init__(self, deezer: DeezerClient, cache: DeezerCache):
        self.deezer = deezer
        self.cache = cache

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        cached = await self.cache.get_track_preview_url(isrc)

        if cached == NO_PREVIEW:
            return None

        if cached is not None:
            return cached

        preview_url = await self.deezer.get_track_preview_url(isrc)
        await self.cache.set_track_preview_url(isrc, preview_url)

        return preview_url
