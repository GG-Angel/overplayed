import functools
from pydantic import BaseModel
from redis.asyncio import Redis, RedisError
from settings import RedisSettings
from typing import Optional, List, TypeVar, Type
from secrets import token_urlsafe
from loguru import logger
from models import (
    SessionInfo,
    SpotifyCurrentUser,
    SpotifyPlaylist,
    SpotifyPlaylistTrack,
    SpotifyTrackPreview,
)

_SESSIONS_KEY = "sessions"
_USERS_KEY = "users"
_PLAYLISTS_KEY = "playlists"
_TRACKS_KEY = "tracks"
_SNAPSHOT_KEY = "snapshot"
_PREVIEWS_KEY = "previews"

_SESSION_ID_LENGTH = 32

M = TypeVar("M", bound=BaseModel)


def redis_error_handler(operation: str):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except RedisError as e:
                logger.error(f"Failed to {operation}: {e}")
                raise

        return wrapper

    return decorator


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    @redis_error_handler("get session")
    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self._get_model(SessionInfo, self._session_key(session_id))

    @redis_error_handler("get user")
    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        return await self._get_model(SpotifyCurrentUser, self._user_key(user_id))

    @redis_error_handler("get playlist")
    async def get_playlist(
        self, user_id: str, playlist_id: str
    ) -> Optional[SpotifyPlaylist]:
        key = self._playlists_key(user_id)

        playlist = await self.redis.hget(key, playlist_id)  # ty:ignore[invalid-await]
        if not playlist:
            logger.debug(f"MISS: {key} (id={playlist_id})")
            return None

        logger.debug(f"HIT: {key} (id={playlist_id})")
        return SpotifyPlaylist.model_validate_json(playlist)

    @redis_error_handler("get playlists")
    async def get_playlists(self, user_id: str) -> Optional[List[SpotifyPlaylist]]:
        key = self._playlists_key(user_id)

        playlist_map = await self.redis.hgetall(key)  # ty:ignore[invalid-await]
        if not playlist_map:
            logger.debug(f"MISS: {key} (no playlists)")
            return None

        logger.debug(f"HIT: {key} (all playlists)")
        return [SpotifyPlaylist.model_validate_json(p) for p in playlist_map.values()]

    @redis_error_handler("get playlist tracks")
    async def get_playlist_tracks(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> Optional[List[SpotifyPlaylistTrack]]:
        snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
        tracks_key = self._playlist_tracks_key(user_id, playlist_id)

        async with self.redis.pipeline() as pipe:
            pipe.get(snapshot_key)
            pipe.lrange(tracks_key, start=offset, end=offset + limit - 1)
            cached_snapshot_id, tracks = await pipe.execute()

        if not tracks or cached_snapshot_id != snapshot_id:
            logger.debug(f"MISS: {tracks_key}")
            return None

        logger.debug(f"HIT: {tracks_key}")
        return [SpotifyPlaylistTrack.model_validate_json(t) for t in tracks]

    @redis_error_handler("get track preview")
    async def get_track_preview(self, track_id: str) -> Optional[SpotifyTrackPreview]:
        return await self._get_model(
            SpotifyTrackPreview, self._track_preview_key(track_id)
        )

    @redis_error_handler("set session")
    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set_model(
            session, self._session_key(session_id), self.settings.ttl_sessions
        )

    @redis_error_handler("set user")
    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set_model(user, self._user_key(user.id), self.settings.ttl_users)

    @redis_error_handler("set playlist")
    async def set_playlist(self, user_id: str, playlist: SpotifyPlaylist) -> None:
        key = self._playlists_key(user_id)
        ttl = self.settings.ttl_playlists

        async with self.redis.pipeline() as pipe:
            pipe.exists(key)
            pipe.hset(key, mapping={playlist.id: playlist.model_dump_json()})
            pipe.expire(key, ttl)
            key_existed, _, _ = await pipe.execute()

        if not key_existed:
            await self.redis.delete(key)  # avoid partial entries
            return

        logger.debug(f"CACHED: playlist {playlist.id} (key={key}, ttl={ttl}s)")

    @redis_error_handler("set playlists")
    async def set_playlists(
        self, user_id: str, playlists: List[SpotifyPlaylist]
    ) -> None:
        key = self._playlists_key(user_id)
        ttl = self.settings.ttl_playlists
        mapping = {p.id: p.model_dump_json() for p in playlists}

        async with self.redis.pipeline() as pipe:
            pipe.delete(key)
            pipe.hset(key, mapping=mapping)
            pipe.expire(key, ttl)
            await pipe.execute()

        logger.debug(f"CACHED: {len(playlists)} playlists (key={key}, ttl={ttl}s)")

    @redis_error_handler("set playlist tracks")
    async def set_playlist_tracks(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        tracks: List[SpotifyPlaylistTrack],
    ) -> None:
        tracks_key = self._playlist_tracks_key(user_id, playlist_id)
        snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
        ttl = self.settings.ttl_tracks
        serialized = [t.model_dump_json() for t in tracks]

        async with self.redis.pipeline() as pipe:
            pipe.delete(tracks_key)
            if serialized:
                pipe.rpush(tracks_key, *serialized)
                pipe.expire(tracks_key, ttl)
                pipe.set(snapshot_key, snapshot_id, ex=ttl)
            else:
                pipe.delete(snapshot_key)  # keep snapshot/tracks in sync
            await pipe.execute()

        logger.debug(f"CACHED: {len(tracks)} tracks (key={tracks_key}, ttl={ttl}s)")

    @redis_error_handler("create session")
    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LENGTH)
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    @redis_error_handler("end session")
    async def end_session(self, session_id: str) -> None:
        await self.redis.delete(self._session_key(session_id))
        logger.info(f"Ended session: {session_id}")

    @redis_error_handler("invalidate playlist")
    async def invalidate_playlist(self, user_id: str, playlist_id: str) -> None:
        playlists_key = self._playlists_key(user_id)
        tracks_key = self._playlist_tracks_key(user_id, playlist_id)
        snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)

        async with self.redis.pipeline() as pipe:
            pipe.hdel(playlists_key, playlist_id)  # remove single entry from hash
            pipe.delete(tracks_key, snapshot_key)  # delete these keys entirely
            await pipe.execute()

        logger.debug(f"Invalidated playlist {playlist_id} for user: {user_id}")

    @redis_error_handler("invalidate playlists")
    async def invalidate_playlists(self, user_id: str) -> None:
        await self.redis.delete(self._playlists_key(user_id))
        logger.debug(f"Invalidated playlists for user: {user_id}")

    async def _get_model(self, model: Type[M], key: str) -> Optional[M]:
        data = await self.redis.get(key)
        if data:
            logger.debug(f"HIT: {key}")
            return model.model_validate_json(data)
        logger.debug(f"MISS: {key}")
        return None

    async def _set_model(self, instance: M, key: str, ttl: int) -> None:
        await self.redis.set(key, instance.model_dump_json(), ex=ttl)
        logger.debug(f"CACHED: {key} (ttl={ttl}s)")

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

    @staticmethod
    def _track_preview_key(track_id: str) -> str:
        """previews:{track_id}"""
        return RedisClient._key(_PREVIEWS_KEY, track_id)
