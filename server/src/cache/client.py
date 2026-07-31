from typing import TypeVar

from fastapi import Depends
from loguru import logger
from pydantic import BaseModel
from redis.asyncio import Redis

from core.redis import get_redis

M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def get(self, key: str) -> str | None:
        data = await self.redis.get(key)
        if data is None:
            logger.debug(f"MISS: {key}")
            return None
        logger.debug(f"HIT: {key}")
        return data

    async def set(self, key: str, value: str, ttl: int) -> None:
        await self.redis.set(key, value, ex=ttl)
        logger.debug(f"CACHED: {key} (ttl={ttl}s)")

    async def hget(self, key: str, field: str) -> str | None:
        data = await self.redis.hget(key, field)  # ty:ignore[invalid-await]
        if data is None:
            logger.debug(f"MISS: {key} (field={field})")
            return None
        logger.debug(f"HIT: {key} (field={field})")
        return data

    async def hgetall(self, key: str) -> dict[str, str] | None:
        async with self.redis.pipeline() as pipe:
            pipe.exists(key)
            pipe.hgetall(key)
            exists, mapping = await pipe.execute()
        if not exists:
            logger.debug(f"MISS: {key}")
            return None
        logger.debug(f"HIT: {key} (n={len(mapping)})")
        return mapping

    async def hset(self, key: str, field: str, value: str, ttl: int) -> None:
        await self.redis.hsetex(key, field, value, ex=ttl)  # ty:ignore[invalid-await]
        logger.debug(f"CACHED: {key} (key={key}, ttl={ttl}s)")

    async def hsetall(self, key: str, mapping: dict[str, str], ttl: int) -> None:
        async with self.redis.pipeline() as pipe:
            pipe.delete(key)
            pipe.hsetex(key, mapping=mapping, ex=ttl)
            await pipe.execute()
        logger.debug(f"CACHED: {len(mapping)} entries (key={key}, ttl={ttl}s)")

    async def delete(self, *keys: str) -> None:
        await self.redis.delete(*keys)
        logger.debug(f"DELETED: {keys}")

    @staticmethod
    def key(*parts: str) -> str:
        return ":".join(parts)


def get_redis_client(redis: Redis = Depends(get_redis)) -> RedisClient:
    return RedisClient(redis=redis)
