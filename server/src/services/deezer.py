from typing import Optional
from clients.deezer.client import DeezerClient
from cache.client import RedisClient


class DeezerService:
    def __init__(self, deezer: DeezerClient, redis: RedisClient):
        self.deezer = deezer
        self.redis = redis

    async def get_track_preview_url(self, isrc: str) -> Optional[str]:
        return "TODO"
