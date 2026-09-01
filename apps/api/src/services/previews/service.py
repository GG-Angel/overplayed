from src.services.previews.cache import NO_PREVIEW, DeezerCache
from src.services.previews.client import DeezerClient
from src.services.previews.models import TrackPreview
from src.services.previews.utils import parse_expiration_timestamp, parse_expires_in


class DeezerService:
    def __init__(
        self,
        deezer: DeezerClient,
        cache: DeezerCache,
    ):
        self.deezer = deezer
        self.cache = cache

    async def get_track_preview(self, isrc: str) -> TrackPreview:
        url = await self._get_track_preview_url(isrc)
        if url is None:
            return TrackPreview(isrc=isrc)

        return TrackPreview(
            isrc=isrc,
            url=url,
            expires_at=parse_expiration_timestamp(url),
            expires_in=parse_expires_in(url),
        )

    async def _get_track_preview_url(self, isrc: str) -> str | None:
        cached = await self.cache.get_track_preview_url(isrc)
        if cached == NO_PREVIEW:
            return None
        if cached is not None:
            return cached

        fetched = await self.deezer.get_track_preview_url(isrc)
        await self.cache.set_track_preview_url(isrc, fetched)
        return fetched
