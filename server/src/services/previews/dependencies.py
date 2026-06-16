from services.previews.cache import DeezerCache
from services.previews.client import DeezerClient
from services.previews.service import DeezerService
from settings import Settings
from fastapi import Depends
from aiohttp import ClientSession
from cache.client import RedisClient, get_redis_client
from state import get_session, get_settings


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
