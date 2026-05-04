from typing import Optional
from aiohttp import ClientSession
from settings import DeezerSettings


class DeezerClient:
    def __init__(self, session: ClientSession, settings: DeezerSettings):
        self.session = session
        self.settings = settings

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        try:
            async with self.session.get(f"/track/isrc:{isrc}") as response:
                response.raise_for_status()
                data = await response.json()
                return data.get("preview")
        except Exception:
            return None
