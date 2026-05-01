from typing import Optional
from redis import RedisError
from secrets import token_urlsafe
from models import TokenInfo
from redis.asyncio import Redis
from loguru import logger


class RedisClient:
    def __init__(self, redis: Redis, ttl_tokens: int):
        self._redis = redis
        self._ttl_tokens = ttl_tokens

    async def create_session(self, token: TokenInfo) -> str:
        session_id = token_urlsafe(32)
        try:
            await self.set_session(session_id, token)
        except RedisError as e:
            logger.exception(f"Failed to create session: {e}")
            raise
        return session_id

    async def set_session(self, session_id: str, token: TokenInfo) -> None:
        try:
            await self._redis.set(
                self._session_key(session_id),
                token.model_dump_json(),
                ex=self._ttl_tokens,
            )
        except RedisError as e:
            logger.exception(f"Failed to set session: {e}")
            raise

    async def get_session(self, session_id: str) -> Optional[TokenInfo]:
        try:
            if token := await self._redis.get(self._session_key(session_id)):
                return TokenInfo.model_validate_json(token)
            return None
        except RedisError as e:
            logger.exception(f"Failed to get session: {e}")
            raise

    async def end_session(self, session_id: str) -> None:
        try:
            await self._redis.delete(self._session_key(session_id))
        except RedisError as e:
            logger.exception(f"Failed to end session: {e}")
            raise

    def _session_key(self, session_id: str) -> str:
        return self._assemble_key("sessions", session_id)

    def _assemble_key(self, resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"
