from cache.client import RedisClient

NO_PREVIEW = "__NO_PREVIEW__"


class DeezerCache:
    def __init__(
        self,
        redis: RedisClient,
        *,
        ttl_previews_hit: int,
        ttl_previews_miss: int,
    ):
        self._client = redis
        self._ttl_previews_hit = ttl_previews_hit
        self._ttl_previews_miss = ttl_previews_miss
        self._track_preview_key = "previews"

    async def get_track_preview_url(self, isrc: str) -> str | None:
        return await self._client.hget(self._track_preview_key, isrc)

    async def set_track_preview_url(self, isrc: str, url: str | None) -> None:
        value = url if url is not None else NO_PREVIEW
        ttl = self._ttl_previews_hit if url is not None else self._ttl_previews_miss
        await self._client.hset(self._track_preview_key, isrc, value, ttl)
