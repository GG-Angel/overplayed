from services.previews.cache import DeezerCache
from services.previews.client import DeezerClient
from services.previews.service import DeezerService
from core.config import Settings
from fastapi import Depends
from aiohttp import ClientSession
from cache.client import RedisClient, get_redis_client
from state import get_session, get_settings


def get_deezer_service(
    settings: Settings = Depends(get_settings),
    session: ClientSession = Depends(get_session),
    redis: RedisClient = Depends(get_redis_client),
) -> DeezerService:
    return DeezerService(
        deezer=DeezerClient(session=session),
        cache=DeezerCache(redis=redis),
    )
