from typing import Optional
from cache.client import RedisClient


NO_PREVIEW = "__NO_PREVIEW__"


class DeezerCache:
    def __init__(self, redis: RedisClient):
        self.client = redis

        self.ttl_previews_hit: int = 60 * 10
        self.ttl_previews_miss: int = 60 * 60 * 2

        self._track_preview_key = "previews"

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        return await self.client.hget(self._track_preview_key, isrc)

    async def set_track_preview_url(self, isrc: str, url: Optional[str]) -> None:
        value = url if url is not None else NO_PREVIEW
        ttl = self.ttl_previews_hit if url is not None else self.ttl_previews_miss
        await self.client.redis.hsetex(self._track_preview_key, isrc, value, ex=ttl)  # fmt:skip  # ty:ignore[invalid-await]
