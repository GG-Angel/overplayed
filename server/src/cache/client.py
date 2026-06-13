from state import get_settings
from core.redis import get_redis
from fastapi import Depends
from core.config import Settings
from base64 import b64encode, b64decode
from os import urandom
from pydantic import BaseModel
from loguru import logger
from typing import Optional, Type, TypeVar, List, AsyncIterator
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from redis.asyncio import Redis


M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis, encryption_key: bytes):
        self.redis = redis
        self._aesgcm = AESGCM(encryption_key)

    async def get(self, key: str) -> Optional[str]:
        data = await self.redis.get(key)
        if data is None:
            logger.debug(f"MISS: {key}")
            return None
        logger.debug(f"HIT: {key}")
        return data

    async def get_secure(self, key: str) -> Optional[str]:
        data = await self.get(key)
        return self._decrypt(data) if data is not None else None

    async def get_model(self, model: Type[M], key: str) -> Optional[M]:
        data = await self.get(key)
        return model.model_validate_json(data) if data is not None else None

    async def get_model_secure(self, model: Type[M], key: str) -> Optional[M]:
        data = await self.get_secure(key)
        return model.model_validate_json(data) if data is not None else None

    async def set(self, key: str, value: str, ttl: int) -> None:
        await self.redis.set(key, value, ex=ttl)
        logger.debug(f"CACHED: {key} (ttl={ttl}s)")

    async def set_secure(self, key: str, value: str, ttl: int) -> None:
        await self.set(key, self._encrypt(value), ttl)

    async def set_model(self, instance: BaseModel, key: str, ttl: int) -> None:
        await self.set(key, instance.model_dump_json(), ttl)

    async def set_model_secure(self, instance: BaseModel, key: str, ttl: int) -> None:
        await self.set_secure(key, instance.model_dump_json(), ttl)

    async def hget_model(self, model: Type[M], key: str, field: str) -> Optional[M]:
        data = await self.redis.hget(key, field)  # ty:ignore[invalid-await]
        if data is None:
            logger.debug(f"MISS: {key} (field={field})")
            return None
        logger.debug(f"HIT: {key} (field={field})")
        return model.model_validate_json(data)

    async def hgetall_models(self, model: Type[M], key: str) -> Optional[List[M]]:
        mapping = await self.redis.hgetall(key)  # ty:ignore[invalid-await]
        if not mapping:
            logger.debug(f"MISS: {key}")
            return None
        logger.debug(f"HIT: {key} (n={len(mapping)})")
        return [model.model_validate_json(v) for v in mapping.values()]

    async def hset_models(
        self, key: str, instances: dict[str, BaseModel], ttl: int
    ) -> None:
        serialized = {k: v.model_dump_json() for k, v in instances.items()}
        async with self.redis.pipeline() as pipe:
            pipe.delete(key)
            pipe.hset(key, mapping=serialized)
            pipe.expire(key, ttl)
            await pipe.execute()
        logger.debug(f"CACHED: {len(instances)} entries (key={key}, ttl={ttl}s)")

    async def delete(self, *keys: str) -> None:
        await self.redis.delete(*keys)
        logger.debug(f"DELETED: {keys}")

    def _encrypt(self, plaintext: str) -> str:
        nonce = urandom(12)
        ciphertext = self._aesgcm.encrypt(nonce, plaintext.encode(), None)
        return b64encode(nonce + ciphertext).decode()

    def _decrypt(self, data: str) -> str:
        raw = b64decode(data.encode())
        nonce, ciphertext = raw[:12], raw[12:]
        return self._aesgcm.decrypt(nonce, ciphertext, None).decode()

    @staticmethod
    def key(*parts: str) -> str:
        return ":".join(parts)


async def get_redis_client(
    settings: Settings = Depends(get_settings),
) -> AsyncIterator[RedisClient]:
    async with get_redis() as session:
        yield RedisClient(redis=session, encryption_key=settings.redis.encryption_key)
