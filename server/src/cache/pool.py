import redis.asyncio as aioredis
from settings import RedisSettings


def create_pool(settings: RedisSettings) -> aioredis.ConnectionPool:
    return aioredis.ConnectionPool.from_url(
        settings.url,
        password=settings.password,
        max_connections=settings.max_connections,
        decode_responses=True,
    )


async def close_pool(pool: aioredis.ConnectionPool) -> None:
    await pool.aclose()
