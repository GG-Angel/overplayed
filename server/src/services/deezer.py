from datetime import datetime, timezone
from models import TrackPreview
from urllib.parse import urlparse, parse_qs
from typing import Optional
from clients import DeezerClient
from cache import DeezerCache, NO_PREVIEW


class DeezerService:
    def __init__(self, deezer: DeezerClient, cache: DeezerCache):
        self.deezer = deezer
        self.cache = cache

    async def get_track_preview(self, isrc: str) -> Optional[TrackPreview]:
        preview_url = await self.cache.get_track_preview_url(isrc)

        if preview_url == NO_PREVIEW:
            return None

        if preview_url is None:
            preview_url = await self.deezer.get_track_preview_url(isrc)
            await self.cache.set_track_preview_url(isrc, preview_url)

        if preview_url is None:
            return None

        return TrackPreview(
            preview_url=preview_url,
            expires_at=self._get_expiration_timestamp(preview_url),
            expires_in=self._get_expires_in(preview_url),
        )

    def _get_expiration_timestamp(self, url: str) -> int:
        parsed = urlparse(url)
        hdnea = parse_qs(parsed.query)["hdnea"][0]
        params = dict(part.split("=", 1) for part in hdnea.split("~"))
        return int(params["exp"])

    def _get_expires_in(self, url: str) -> int:
        exp_timestamp = self._get_expiration_timestamp(url)
        expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        return int((expires_at - datetime.now(timezone.utc)).total_seconds())
