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
_SNAPSHOT_KEY = "snapshot"

_SESSION_ID_LENGTH = 64

M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self._get_model(SessionInfo, RedisClient._session_key(session_id))

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        return await self._get_model(SpotifyCurrentUser, RedisClient._user_key(user_id))

    async def get_playlist(
        self, user_id: str, playlist_id: str
    ) -> Optional[SpotifyPlaylist]:
        key = RedisClient._playlists_key(user_id)
        if playlist := await self.redis.hget(key, playlist_id):  # ty:ignore[invalid-await]
            logger.debug(f"Cache hit: {key}")
            return SpotifyPlaylist.model_validate_json(playlist)
        logger.debug(f"Cache miss: {key}")
        return None

    async def get_playlists(self, user_id: str) -> Optional[List[SpotifyPlaylist]]:
        key = RedisClient._playlists_key(user_id)
        if not await self.redis.exists(key):
            logger.debug(f"Cache miss (no playlists): {key}")
            return None

        logger.debug(f"Cache hit: {key}")
        playlist_map = await self.redis.hgetall(key)  # ty:ignore[invalid-await]
        return [SpotifyPlaylist.model_validate_json(p) for p in playlist_map.values()]

    async def get_playlist_tracks(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> Optional[List[SpotifyPlaylistTrack]]:
        snapshot_key = RedisClient._playlist_snapshot_key(user_id, playlist_id)
        tracks_key = RedisClient._playlist_tracks_key(user_id, playlist_id)

        if not await self.redis.exists(tracks_key):
            logger.debug(f"Cache miss (no tracks): {tracks_key}")
            return None

        cached_snapshot_id = await self.redis.get(snapshot_key)
        if cached_snapshot_id != snapshot_id:
            logger.debug(f"Cache miss (stale snapshot): {snapshot_key}")
            return None

        logger.debug(f"Cache hit: {tracks_key}")
        tracks = await self.redis.lrange(
            tracks_key, start=offset, end=offset + limit - 1
        )  # ty:ignore[invalid-await]
        return [SpotifyPlaylistTrack.model_validate_json(t) for t in tracks]

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set_model(
            session, RedisClient._session_key(session_id), self.settings.ttl_sessions
        )

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set_model(
            user, RedisClient._user_key(user.id), self.settings.ttl_users
        )

    async def set_playlist(self, user_id: str, playlist: SpotifyPlaylist) -> None:
        key = RedisClient._playlists_key(user_id)
        ttl = self.settings.ttl_playlists

        if not await self.redis.exists(key):
            return  # don't create a partial cache entry

        async with self._error_handler(f"set playlist (key={key})"):
            async with self.redis.pipeline() as pipe:
                pipe.hset(key, mapping={playlist.id: playlist.model_dump_json()})
                pipe.expire(key, ttl)
                await pipe.execute()

        logger.debug(f"Cached: playlist {playlist.id} (key={key}, ttl={ttl}s)")

    async def set_playlists(
        self, user_id: str, playlists: List[SpotifyPlaylist]
    ) -> None:
        key = RedisClient._playlists_key(user_id)
        ttl = self.settings.ttl_playlists
        mapping = {p.id: p.model_dump_json() for p in playlists}

        async with self._error_handler(f"set playlists (key={key})"):
            async with self.redis.pipeline() as pipe:
                pipe.delete(key)
                pipe.hset(key, mapping=mapping)
                pipe.expire(key, ttl)
                await pipe.execute()

        logger.debug(f"Cached: {len(playlists)} playlists (key={key}, ttl={ttl}s)")

    async def set_playlist_tracks(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        tracks: List[SpotifyPlaylistTrack],
    ) -> None:
        tracks_key = RedisClient._playlist_tracks_key(user_id, playlist_id)
        snapshot_key = RedisClient._playlist_snapshot_key(user_id, playlist_id)
        ttl = self.settings.ttl_tracks
        serialized = [t.model_dump_json() for t in tracks]

        async with self._error_handler(f"set playlist tracks (key={tracks_key})"):
            async with self.redis.pipeline() as pipe:
                # store tracks
                pipe.delete(tracks_key)
                pipe.rpush(tracks_key, *serialized)
                pipe.expire(tracks_key, ttl)

                # store snapshot id
                pipe.set(snapshot_key, snapshot_id, ex=ttl)

                await pipe.execute()

        logger.debug(f"Cached: {len(tracks)} tracks (key={tracks_key}, ttl={ttl}s)")

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LENGTH)
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def end_session(self, session_id: str) -> None:
        key = RedisClient._session_key(session_id)
        async with self._error_handler("end session"):
            await self.redis.delete(key)
        logger.info(f"Ended session: {session_id}")

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
    def _playlists_key(user_id: str) -> str:
        """users:{user_id}:playlists"""
        return RedisClient._key(RedisClient._user_key(user_id), _PLAYLISTS_KEY)

    @staticmethod
    def _playlist_tracks_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:tracks"""
        return RedisClient._key(
            RedisClient._playlists_key(user_id), playlist_id, _TRACKS_KEY
        )

    @staticmethod
    def _playlist_snapshot_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:snapshot"""
        return RedisClient._key(
            RedisClient._playlists_key(user_id), playlist_id, _SNAPSHOT_KEY
        )

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
