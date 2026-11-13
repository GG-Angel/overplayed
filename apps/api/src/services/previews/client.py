from aiohttp import ClientSession


class DeezerClient:
    def __init__(self, session: ClientSession):
        self.session = session
        self.base_url = "https://api.deezer.com"

    async def get_track_preview_url(self, isrc: str) -> str | None:
        async with self.session.get(f"{self.base_url}/track/isrc:{isrc}") as response:
            response.raise_for_status()
            data = await response.json()
            assert isinstance(data, dict)
            return data.get("preview") or None
