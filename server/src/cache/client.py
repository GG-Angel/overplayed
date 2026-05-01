from contextlib import asynccontextmanager
from pydantic import BaseModel
from settings import RedisSettings
from typing import Optional
from redis import RedisError
from secrets import token_urlsafe
from models import SessionInfo, SpotifyCurrentUser
from redis.asyncio import Redis
from loguru import logger


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    @asynccontextmanager
    async def redis_error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.exception(f"Failed to {operation}: {e}")
            raise

    async def store(self, key: str, model: BaseModel, ex: int) -> None:
        async with self.redis_error_handler(f"store {key}"):
            await self.redis.set(key, model.model_dump_json(), ex=ex)

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        async with self.redis_error_handler("get user"):
            user = await self.redis.get(self.get_user_key(user_id))
            return SpotifyCurrentUser.model_validate_json(user) if user else None

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self.store(self.get_user_key(user.id), user, self.settings.ttl_users)

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(32)
        await self.set_session(session_id, info)
        return session_id

    async def set_session(self, session_id: str, info: SessionInfo) -> None:
        await self.store(self.get_session_key(session_id), info, self.settings.ttl_sessions)  # fmt: skip

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        async with self.redis_error_handler("get session"):
            if session := await self.redis.get(self.get_session_key(session_id)):
                return SessionInfo.model_validate_json(session)
            return None

    async def end_session(self, session_id: str) -> None:
        async with self.redis_error_handler("end session"):
            await self.redis.delete(self.get_session_key(session_id))

    def get_user_key(self, user_id: str) -> str:
        return self.format_key("users", user_id)

    def get_session_key(self, session_id: str) -> str:
        return self.format_key("sessions", session_id)

    def format_key(self, resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"
