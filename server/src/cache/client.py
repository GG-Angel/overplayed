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

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        try:
            user = await self.redis.get(self.get_user_key(user_id))
            return SpotifyCurrentUser.model_validate_json(user) if user else None
        except RedisError as e:
            logger.exception(f"Failed to get user: {e}")
            raise

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        try:
            await self.redis.set(
                self.get_user_key(user.id),
                user.model_dump_json(),
                ex=self.settings.ttl_users,
            )
        except RedisError as e:
            logger.exception(f"Failed to set user: {e}")
            raise

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(32)
        try:
            await self.set_session(session_id, info)
        except RedisError as e:
            logger.exception(f"Failed to create session: {e}")
            raise
        return session_id

    async def set_session(self, session_id: str, info: SessionInfo) -> None:
        try:
            await self.redis.set(
                self.get_session_key(session_id),
                info.model_dump_json(),
                ex=self.settings.ttl_sessions,
            )
        except RedisError as e:
            logger.exception(f"Failed to set session: {e}")
            raise

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        try:
            if token := await self.redis.get(self.get_session_key(session_id)):
                return SessionInfo.model_validate_json(token)
            return None
        except RedisError as e:
            logger.exception(f"Failed to get session: {e}")
            raise

    async def end_session(self, session_id: str) -> None:
        try:
            await self.redis.delete(self.get_session_key(session_id))
        except RedisError as e:
            logger.exception(f"Failed to end session: {e}")
            raise

    def get_user_key(self, user_id: str) -> str:
        return self.format_key("users", user_id)

    def get_session_key(self, session_id: str) -> str:
        return self.format_key("sessions", session_id)

    def format_key(self, resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"
