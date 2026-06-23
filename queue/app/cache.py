from redis.asyncio import Redis
from typing import Protocol


class Cache(Protocol):
    async def get(self, key: str) -> str | None: ...
    async def set(self, key: str, value: str, *, ttl: int | None = None) -> None: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...


class RedisCache:
    def __init__(self, redis: Redis):
        self._redis = redis

    async def get(self, key: str) -> str | None:
        value = await self._redis.get(key)
        if isinstance(value, bytes):
            value = value.decode()
        return value

    async def set(self, key: str, value: str, *, ttl: int | None = None) -> None:
        await self._redis.set(key, value, ex=ttl)

    async def delete(self, key: str) -> None:
        await self._redis.delete(key)

    async def exists(self, key: str) -> bool:
        return await self._redis.exists(key) >= 1
