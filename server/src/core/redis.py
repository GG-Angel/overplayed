from settings import Settings
from typing import AsyncGenerator
from fastapi import Depends
from redis.asyncio import ConnectionPool, Redis
from state import get_app_state, State


def build_redis_pool(settings: Settings) -> ConnectionPool:
    return ConnectionPool.from_url(
        settings.redis_url, decode_responses=True, max_connections=20
    )


async def get_redis(state: State = Depends(get_app_state)) -> AsyncGenerator[Redis]:
    redis = Redis(connection_pool=state.redis_pool)
    try:
        yield redis
    finally:
        await redis.aclose()
