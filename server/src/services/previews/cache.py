from typing import Optional
from cache.client import RedisClient


NO_PREVIEW = "__NO_PREVIEW__"


class DeezerCache:
    def __init__(self, redis: RedisClient):
        self.redis = redis

        self.ttl_previews_hit: int = 60 * 10
        self.ttl_previews_miss: int = 60 * 60 * 2

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        return await self.redis.get(self._track_preview_key(isrc))

    async def set_track_preview_url(self, isrc: str, url: Optional[str]) -> None:
        key = self._track_preview_key(isrc)
        if url is not None:
            await self.redis.set(key, url, self.ttl_previews_hit)
        else:
            await self.redis.set(key, NO_PREVIEW, self.ttl_previews_miss)

    @staticmethod
    def _track_preview_key(isrc: str) -> str:
        """previews:{isrc}"""
        return RedisClient.key("previews", isrc)
