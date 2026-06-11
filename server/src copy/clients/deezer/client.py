from loguru import logger
from typing import Optional
from aiohttp import ClientSession
from settings import DeezerSettings


class DeezerClient:
    def __init__(self, session: ClientSession, settings: DeezerSettings):
        self.session = session
        self.settings = settings

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        async with self.session.get(
            f"{self.settings.url}/track/isrc:{isrc}"
        ) as response:
            response.raise_for_status()
            data = await response.json()

            if not isinstance(data, dict):
                logger.error(f"Bad format for ISRC {isrc}: got {type(data).__name__}")
                return None

            return data.get("preview") or None
