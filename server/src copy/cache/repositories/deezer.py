from settings import RedisSettings
from typing import Literal, Optional
from cache import RedisCore

NO_PREVIEW = "NO_PREVIEW"


class DeezerCache:
    def __init__(self, core: RedisCore, settings: RedisSettings):
        self.core = core
        self.settings = settings

    async def get_track_preview_url(
        self, isrc: str
    ) -> str | Literal["NO_PREVIEW"] | None:
        cached = await self.core.get(self._track_preview_key(isrc))
        if cached is None:
            return None
        return NO_PREVIEW if cached == NO_PREVIEW else cached

    async def set_track_preview_url(
        self, isrc: str, preview_url: Optional[str]
    ) -> None:
        has_preview = preview_url is not None
        await self.core.set(
            self._track_preview_key(isrc),
            preview_url if has_preview else NO_PREVIEW,
            self.settings.ttl_previews_hit
            if has_preview
            else self.settings.ttl_previews_miss,
        )

    @staticmethod
    def _track_preview_key(isrc: str) -> str:
        """previews:{isrc}"""
        return RedisCore.key("previews", isrc)
