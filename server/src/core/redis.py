from typing import AsyncGenerator
from redis.asyncio import ConnectionPool, Redis
from .config import settings

pool = ConnectionPool.from_url(
    settings.redis.url,
    password=settings.redis.password,
    decode_responses=True,
    max_connections=20,
)


async def get_session() -> AsyncGenerator[Redis]:
    async with Redis.from_pool(pool) as session:
        try:
            yield session
        finally:
            await session.aclose()
