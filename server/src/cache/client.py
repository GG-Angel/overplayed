from contextlib import asynccontextmanager
from pydantic import BaseModel
from settings import RedisSettings
from typing import Optional, TypeVar, Type
from redis import RedisError
from secrets import token_urlsafe
from models import SessionInfo, SpotifyCurrentUser, SpotifyPlaylist
from redis.asyncio import Redis
from loguru import logger

T = TypeVar("T", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        return await self._fetch(self._get_user_key(user_id), SpotifyCurrentUser)

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._store(self._get_user_key(user.id), user, self.settings.ttl_users)

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(32)
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._store(
            self._get_session_key(session_id), session, self.settings.ttl_sessions
        )

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self._fetch(self._get_session_key(session_id), SessionInfo)

    async def end_session(self, session_id: str) -> None:
        session_key = self._get_session_key(session_id)
        async with self._error_handler("end session"):
            await self.redis.delete(session_key)
        logger.info(f"Ended session: {session_id}")

    async def get_playlist(self, playlist_id: str) -> Optional[SpotifyPlaylist]:
        return await self._fetch(self._get_playlist_key(playlist_id), SpotifyPlaylist)

    async def set_playlist(self, playlist: SpotifyPlaylist) -> None:
        await self._store(
            self._get_playlist_key(playlist.id), playlist, self.settings.ttl_playlists
        )

    async def _fetch(self, key: str, model: Type[T]) -> Optional[T]:
        async with self._error_handler(f"fetch {key}"):
            data = await self.redis.get(key)
            if data:
                logger.debug(f"Cache hit: {key}")
                return model.model_validate_json(data)
            logger.debug(f"Cache miss: {key}")
            return None

    async def _store(self, key: str, model: BaseModel, ex: int) -> None:
        async with self._error_handler(f"store {key}"):
            await self.redis.set(key, model.model_dump_json(), ex=ex)
        logger.debug(f"Cached: {key} (ttl={ex}s)")

    def _get_session_key(self, session_id: str) -> str:
        return self._format_key("sessions", session_id)

    def _get_user_key(self, user_id: str) -> str:
        return self._format_key("users", user_id)

    def _get_playlist_key(self, playlist_id: str) -> str:
        return self._format_key("playlists", playlist_id)

    def _format_key(self, resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
