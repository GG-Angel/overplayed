from contextlib import asynccontextmanager
from core.config import settings
from typing import AsyncGenerator
from redis.asyncio import ConnectionPool, Redis

pool = ConnectionPool.from_url(
    settings.redis_url,
    password=settings.redis_password,
    decode_responses=True,
    max_connections=20,
)


@asynccontextmanager
async def get_redis() -> AsyncGenerator[Redis]:
    async with Redis.from_pool(pool) as session:
        try:
            yield session
        finally:
            await session.aclose()
