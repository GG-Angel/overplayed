from collections.abc import Mapping
from typing import TypeVar, cast

from fastapi import Depends
from loguru import logger
from pydantic import BaseModel
from redis.asyncio import Redis
from redis.typing import EncodableT, FieldT

from core.redis import get_redis

M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def get(self, key: str) -> str | None:
        data = await self.redis.get(key)
        if data is None:
            logger.debug("Cache miss")
            return None
        if isinstance(data, bytes):
            data = data.decode()
        logger.debug("Cache hit")
        return data

    async def set(self, key: str, value: str, ttl: int) -> None:
        await self.redis.set(key, value, ex=ttl)
        logger.debug(f"Cached value (ttl={ttl}s)")

    async def hget(self, key: str, field: str) -> str | None:
        data = await self.redis.hget(key, field)
        if data is None:
            logger.debug("Cache hash miss")
            return None
        if isinstance(data, bytes):
            data = data.decode()
        logger.debug("Cache hash hit")
        return data

    async def hgetall(self, key: str) -> dict[str, str] | None:
        async with self.redis.pipeline() as pipe:
            pipe.exists(key)
            pipe.hgetall(key)
            exists, mapping = await pipe.execute()
        if not exists:
            logger.debug("Cache hash miss")
            return None
        logger.debug(f"Cache hash hit (n={len(mapping)})")
        return mapping

    async def hset(self, key: str, field: str, value: str, ttl: int) -> None:
        await self.redis.hsetex(key, field, value, ex=ttl)
        logger.debug(f"Cached hash value (ttl={ttl}s)")

    async def hsetall(self, key: str, mapping: Mapping[str, str], ttl: int) -> None:
        async with self.redis.pipeline() as pipe:
            pipe.delete(key)
            pipe.hsetex(key, mapping=cast(Mapping[FieldT, EncodableT], mapping), ex=ttl)
            await pipe.execute()
        logger.debug(f"Cached {len(mapping)} hash entries (ttl={ttl}s)")

    async def delete(self, *keys: str) -> None:
        await self.redis.delete(*keys)
        logger.debug(f"Deleted {len(keys)} cached value(s)")

    @staticmethod
    def key(*parts: str) -> str:
        return ":".join(parts)


def get_redis_client(redis: Redis = Depends(get_redis)) -> RedisClient:
    return RedisClient(redis=redis)
