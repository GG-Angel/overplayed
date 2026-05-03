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
_PLAYLIST_IDS_KEY = "playlistIds"
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
        return await self._get_model(SessionInfo, self._session_key(session_id))

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        return await self._get_model(SpotifyCurrentUser, self._user_key(user_id))

    # async def get_playlist(self, playlist_id: str) -> Optional[SpotifyPlaylist]:
    #     return await self._get_model(SpotifyPlaylist, self._playlist_key(playlist_id))

    # async def get_user_playlists(self, user_id: str) -> Optional[List[SpotifyPlaylist]]:
        # if playlists := await self._get_playlists(user_id):
        #     return playlists
        # return None

    # async def get_playlist_tracks(
    #     self, *, playlist_id: str, snapshot_id: str, offset: int, limit: int
    # ) -> Optional[List[SpotifyPlaylistTrack]]:
    #     async with self._error_handler(f"get playlist tracks (playlist={playlist_id})"):
    #         key = self._key(_PLAYLIST_TRACKS_KEY, playlist_id)
    #         snapshot_key = self._key(key, "snapshot")
    #         cached_snapshot_id = await self.redis.get(snapshot_key)

    #         if cached_snapshot_id is None:
    #             logger.debug(f"Cache miss: {key}")
    #             return None

    #         if cached_snapshot_id != snapshot_id:
    #             logger.debug(f"Cache miss (stale snapshot): {key}")
    #             return None

    #         tracks = await self.redis.lrange(key, start=offset, end=offset + limit - 1)  # ty:ignore[invalid-await]
    #         logger.debug(f"Cache hit: {key}")
    #         return [SpotifyPlaylistTrack.model_validate_json(t) for t in tracks]

    #     logger.warning(f"Cache miss after snapshot was found: {key}")
    #     return None

    # --- Setters ---

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set_model(
            session, self._session_key(session_id), self.settings.ttl_sessions
        )

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set_model(user, self._user_key(user.id), self.settings.ttl_users)

    # async def set_playlist(self, playlist: SpotifyPlaylist) -> None:
    #     await self._set_model(
    #         playlist, self._playlist_key(playlist.id), self.settings.ttl_playlists
    #     )

    # async def set_user_playlists(
    #     self, user_id: str, playlists: List[SpotifyPlaylist]
    # ) -> None:
    #     ex = self.settings.ttl_playlists
    #     playlist_ids = [p.id for p in playlists]

    #     async with self._error_handler(f"set playlists (user={user_id})"):
    #         async with self.redis.pipeline() as pipe:
    #             # store playlists
    #             for p in playlists:
    #                 playlist_key = self._playlist_key(p.id)
    #                 pipe.set(playlist_key, p.model_dump_json(), ex=ex)

    #             # store references to playlists for this user
    #             playlist_ids_key = self._user_playlist_ids_key(user_id)
    #             pipe.delete(playlist_ids_key)
    #             pipe.rpush(playlist_ids_key, *playlist_ids)
    #             pipe.expire(playlist_ids_key, ex)

    #             await pipe.execute()

    #     logger.debug(f"Cached: {len(playlists)} playlists (user={user_id}, ttl={ex}s)")

    # async def set_playlist_tracks(
    #     self, tracks: List[SpotifyPlaylistTrack], *, playlist_id: str, snapshot_id: str
    # ) -> None:
    #     key = self._key(_PLAYLIST_TRACKS_KEY, playlist_id)
    #     snapshot_key = self._key(key, "snapshot")
    #     serialized = [t.model_dump_json() for t in tracks]

    #     async with self._error_handler(f"set playlist tracks (playlist={playlist_id})"):
    #         async with self.redis.pipeline() as pipe:
    #             pipe.delete(key)  # remove stale list
    #             pipe.rpush(key, *serialized)
    #             pipe.expire(key, self.settings.ttl_tracks)

    #             pipe.set(snapshot_key, snapshot_id)
    #             pipe.expire(snapshot_key, self.settings.ttl_tracks)

    #             await pipe.execute()

    #         logger.debug(
    #             f"Cached: {len(tracks)} tracks (playlist={playlist_id}, ttl={self.settings.ttl_tracks}s)"
    #         )

    # --- Session Lifecycle ---

    # async def create_session(self, info: SessionInfo) -> str:
    #     for _ in range(_SESSION_ID_MAX_ATTEMPTS):
    #         session_id = token_urlsafe(_SESSION_ID_LENGTH)
    #         if not await self.redis.exists(self._key(_SESSIONS_KEY, session_id)):
    #             break  # id is unique
    #     else:
    #         raise RuntimeError("Failed to generate a unique session ID")

    #     await self.set_session(session_id, info)
    #     logger.info(f"Created session: {session_id}")
    #     return session_id

    # async def end_session(self, session_id: str) -> None:
    #     async with self._error_handler("end session"):
    #         await self.redis.delete(self._key(_SESSIONS_KEY, session_id))
    #     logger.info(f"Ended session: {session_id}")

    # --- Helpers ---

    # async def _get_user_playlist_ids(self, user_id: str) -> Optional[List[str]]:
    #     return await self._get_list(self._user_playlist_ids_key(user_id))

    # async def _get_playlists(
    #     self, playlist_ids: List[str]
    # ) -> Optional[List[SpotifyPlaylist]]:
    #     keys = [self._playlist_key(p_id) for p_id in playlist_ids]
    #     playlists = await self.redis.mget(keys)
    #     if None in playlists:
    #         return None  # stale
    #     return [SpotifyPlaylist.model_validate_json(p) for p in playlists]

    async def _get_list(self, key: str) -> Optional[List[str]]:
        if self.redis.exists(key):
            return await self.redis.lrange(key, 0, -1)  # ty:ignore[invalid-await]
        return None

    async def _get_model(self, model: Type[M], key: str) -> Optional[M]:
        """Fetch a JSON-serialized Pydantic model."""
        data = await self._get(key)
        return model.model_validate_json(data) if data else None

    async def _set_model(self, instance: M, key: str, ttl: int) -> None:
        """Serialize a Pydantic model to JSON and store it."""
        await self._set(key, instance.model_dump_json(), ttl)

    async def _get(self, key: str) -> Optional[str]:
        """Get a cached item."""
        async with self._error_handler(f"get {key}"):
            data = await self.redis.get(key)
            if data:
                logger.debug(f"Cache hit: {key}")
                return data
            else:
                logger.debug(f"Cache miss: {key}")
                return None

    async def _set(self, key: str, value: str, ex: int) -> None:
        """Cache an item."""
        async with self._error_handler(f"set {key}"):
            await self.redis.set(key, value, ex=ex)
            logger.debug(f"Cached: {key} (ttl={ex}s)")

    @staticmethod
    def _key(*parts: str) -> str:
        return ":".join(parts)

    @staticmethod
    def _session_key(session_id: str) -> str:
        return RedisClient._key(_SESSIONS_KEY, session_id)

    @staticmethod
    def _user_key(user_id: str) -> str:
        return RedisClient._key(_USERS_KEY, user_id)

    @staticmethod
    def _user_playlist_key(user_id: str, playlist_id: str) -> str:
        return RedisClient._key(RedisClient._user_key(user_id), _PLAYLIST_IDS_KEY, playlist_id)

    @staticmethod
    def _user_playlist_tracks_key(user_id: str, playlist_id: str) -> str:
        return RedisClient._key(RedisClient._user_playlist_key(user_id, playlist_id), _TRACKS_KEY)

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
