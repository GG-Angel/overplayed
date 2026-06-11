from typing import Optional
from core.config import RedisSettings
from api.cache.client import RedisClient


NO_PREVIEW = "__NO_PREVIEW__"


class DeezerCache:
    def __init__(self, client: RedisClient, settings: RedisSettings):
        self.client = client
        self.settings = settings

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        return await self.client.get(self._track_preview_key(isrc))

    async def set_track_preview_url(self, isrc: str, url: Optional[str]) -> None:
        key = self._track_preview_key(isrc)
        if url is not None:
            await self.client.set(key, url, self.settings.ttl_previews_hit)
        else:
            await self.client.set(key, NO_PREVIEW, self.settings.ttl_previews_miss)

    @staticmethod
    def _track_preview_key(isrc: str) -> str:
        """previews:{isrc}"""
        return RedisClient.key("previews", isrc)
