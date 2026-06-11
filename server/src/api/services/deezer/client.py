from core.config import DeezerSettings
from typing import Optional
from aiohttp import ClientSession


class DeezerClient:
    def __init__(self, session: ClientSession, settings: DeezerSettings):
        self.session = session
        self.settings = settings

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        async with self.session.get(
            f"{self.settings.base_url}/track/isrc:{isrc}"
        ) as response:
            response.raise_for_status()
            data = await response.json()
            assert isinstance(data, dict)
            return data.get("preview") or None
