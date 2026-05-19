from typing import Optional
from clients.deezer.client import DeezerClient
from cache.client import RedisClient, NO_PREVIEW


class DeezerService:
    def __init__(self, deezer: DeezerClient, redis: RedisClient):
        self.deezer = deezer
        self.redis = redis

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        cached = await self.redis.get_track_preview_url(isrc)
        if cached == NO_PREVIEW:
            return None
        if cached is not None:
            return cached

        preview_url = await self.deezer.get_track_preview_url(isrc)
        await self.redis.set_track_preview_url(isrc, preview_url)
        return preview_url
