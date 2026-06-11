from core.config import Settings
from fastapi import Depends
from aiohttp import ClientSession
from .cache import DeezerCache
from .service import DeezerService
from .client import DeezerClient
from api.cache.client import RedisClient
from api.dependencies import get_session, get_redis, get_settings


def get_deezer_service(
    settings: Settings = Depends(get_settings),
    session: ClientSession = Depends(get_session),
    redis: RedisClient = Depends(get_redis),
) -> DeezerService:
    return DeezerService(
        deezer=DeezerClient(session=session, settings=settings.deezer),
        cache=DeezerCache(redis=redis, settings=settings.redis),
    )
