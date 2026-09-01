from aiohttp import ClientSession
from fastapi import Depends

from src.cache.client import RedisClient, get_redis_client
from src.services.previews.cache import DeezerCache
from src.services.previews.client import DeezerClient
from src.services.previews.service import DeezerService
from src.settings import Settings
from src.state import get_session, get_settings


def get_deezer_service(
    session: ClientSession = Depends(get_session),
    redis: RedisClient = Depends(get_redis_client),
    settings: Settings = Depends(get_settings),
) -> DeezerService:
    return DeezerService(
        deezer=DeezerClient(session=session),
        cache=DeezerCache(
            redis=redis,
            ttl_previews_hit=settings.ttl_previews_hit,
            ttl_previews_miss=settings.ttl_previews_miss,
        ),
    )
