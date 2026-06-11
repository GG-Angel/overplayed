from typing import Optional
from .cache import DeezerCache, NO_PREVIEW
from .client import DeezerClient
from .models import TrackPreview
from .utils import parse_expiration_timestamp, parse_expires_in


class DeezerService:
    def __init__(
        self,
        deezer: DeezerClient,
        cache: DeezerCache,
    ):
        self.deezer = deezer
        self.cache = cache

    async def get_track_preview(self, isrc: str) -> Optional[TrackPreview]:
        url = await self._get_track_preview_url(isrc)
        if url is None:
            return None

        return TrackPreview(
            isrc=isrc,
            url=url,
            expires_at=parse_expiration_timestamp(url),
            expires_in=parse_expires_in(url),
        )

    async def _get_track_preview_url(self, isrc: str) -> Optional[str]:
        cached = await self.cache.get_track_preview_url(isrc)
        if cached == NO_PREVIEW:
            return None
        if cached is not None:
            return cached

        fetched = await self.deezer.get_track_preview_url(isrc)
        await self.cache.set_track_preview_url(isrc, fetched)
        return fetched
