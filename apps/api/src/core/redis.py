from collections.abc import AsyncGenerator

from fastapi import Depends
from redis.asyncio import ConnectionPool, Redis

from src.settings import Settings
from src.state import State, get_state


def build_redis_pool(settings: Settings) -> ConnectionPool:
    return ConnectionPool.from_url(
        settings.redis_url, decode_responses=True, max_connections=20
    )


async def get_redis(state: State = Depends(get_state)) -> AsyncGenerator[Redis]:
    redis = Redis(connection_pool=state.redis_pool)
    try:
        yield redis
    finally:
        await redis.aclose()
