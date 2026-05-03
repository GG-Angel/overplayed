import json
from pydantic import BaseModel
from redis.asyncio import Redis, RedisError
from contextlib import asynccontextmanager
from settings import RedisSettings
from typing import Optional, List, TypeVar, Type
from secrets import token_urlsafe
from loguru import logger
from models import (
    SessionInfo,
    SpotifyCurrentUser,
    SpotifyPlaylist,
    SpotifyPlaylistTrack,
)

_SESSIONS_KEY = "sessions"
_USERS_KEY = "users"
_PLAYLISTS_KEY = "playlists"
_TRACKS_KEY = "tracks"

_SESSION_ID_MAX_ATTEMPTS = 10
_SESSION_ID_LENGTH = 32

M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    # --- Getters ---

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self._get_model(SessionInfo, RedisClient._session_key(session_id))

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        return await self._get_model(SpotifyCurrentUser, RedisClient._user_key(user_id))

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set_model(
            session, RedisClient._session_key(session_id), self.settings.ttl_sessions
        )

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set_model(
            user, RedisClient._user_key(user.id), self.settings.ttl_users
        )

    async def set_playlists(
        self, user_id: str, playlists: List[SpotifyPlaylist]
    ) -> None:
        key = self._user_playlists_key(user_id)
        ttl = self.settings.ttl_playlists
        mapping = {p.id: p.model_dump_json() for p in playlists}

        async with self._error_handler(f"set playlists (key={key})"):
            async with self.redis.pipeline() as pipe:
                pipe.delete(key)
                pipe.hset(key, mapping=mapping)
                pipe.expire(key, ttl)
                await pipe.execute()

        logger.debug(f"Cached: {len(playlists)} playlists (key={key}, ttl={ttl}s)")

    async def set_tracks(
        self, user_id: str, playlist_id: str, tracks: List[SpotifyPlaylistTrack]
    ) -> None:
        key = self._user_playlist_tracks_key(user_id=user_id, playlist_id=playlist_id)
        ttl = self.settings.ttl_tracks
        serialized = [t.model_dump_json() for t in tracks]

        async with self._error_handler(f"set playlist tracks (key={key})"):
            async with self.redis.pipeline() as pipe:
                pipe.delete(key)
                pipe.rpush(key, *serialized)
                pipe.expire(key, ttl)
                await pipe.execute()

        logger.debug(f"Cached: {len(tracks)} tracks (key={key}, ttl={ttl}s)")

    # --- Private Helpers ---

    async def _get_list(self, key: str) -> Optional[List[str]]:
        if self.redis.exists(key):
            return await self.redis.lrange(key, 0, -1)  # ty:ignore[invalid-await]
        return None

    async def _get_model(self, model: Type[M], key: str) -> Optional[M]:
        data = await self._get(key)
        return model.model_validate_json(data) if data else None

    async def _get(self, key: str) -> Optional[str]:
        async with self._error_handler(f"get {key}"):
            data = await self.redis.get(key)
            if data:
                logger.debug(f"Cache hit: {key}")
                return data
            else:
                logger.debug(f"Cache miss: {key}")
                return None

    async def _set_model(self, instance: M, key: str, ttl: int) -> None:
        await self._set(key, instance.model_dump_json(), ttl)

    async def _set(self, key: str, value: str, ex: int) -> None:
        async with self._error_handler(f"set {key}"):
            await self.redis.set(key, value, ex=ex)
            logger.debug(f"Cached: {key} (ttl={ex}s)")

    @staticmethod
    def _key(*parts: str) -> str:
        return ":".join(parts)

    @staticmethod
    def _session_key(session_id: str) -> str:
        """sessions:{session_id}"""
        return RedisClient._key(_SESSIONS_KEY, session_id)

    @staticmethod
    def _user_key(user_id: str) -> str:
        """users:{user_id}"""
        return RedisClient._key(_USERS_KEY, user_id)

    @staticmethod
    def _user_playlists_key(user_id: str) -> str:
        """users:{user_id}:playlists"""
        return RedisClient._key(RedisClient._user_key(user_id), _PLAYLISTS_KEY)

    @staticmethod
    def _user_playlist_tracks_key(*, user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:tracks"""
        return RedisClient._key(
            RedisClient._user_playlists_key(user_id),
            playlist_id,
            _TRACKS_KEY,
        )

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
