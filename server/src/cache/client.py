from pydantic import BaseModel
import json
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
_USER_PLAYLIST_IDS_KEY = "userPlaylistIds"
_PLAYLISTS_KEY = "playlists"
_PLAYLIST_TRACKS_KEY = "playlistTracks"

_FIELD_SNAPSHOT_ID = "snapshot_id"
_FIELD_TRACKS = "tracks"

_SESSION_ID_MAX_ATTEMPTS = 10
_SESSION_ID_LENGTH = 32

M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    # --- Getters ---

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self._get_model(SessionInfo, _SESSIONS_KEY, session_id)

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        return await self._get_model(SpotifyCurrentUser, _USERS_KEY, user_id)

    async def get_playlist(self, playlist_id: str) -> Optional[SpotifyPlaylist]:
        return await self._get_model(SpotifyPlaylist, _PLAYLISTS_KEY, playlist_id)

    async def get_user_playlists(self, user_id: str) -> Optional[List[SpotifyPlaylist]]:
        if playlist_ids := await self._get_user_playlist_ids(user_id):
            if playlists := await self._get_playlists(playlist_ids):
                return playlists
        return None

    async def get_playlist_tracks(
        self, *, playlist_id: str, snapshot_id: str
    ) -> Optional[List[SpotifyPlaylistTrack]]:
        key = self._key(_PLAYLIST_TRACKS_KEY, playlist_id)
        async with self._error_handler(f"get playlist tracks (playlist={playlist_id})"):
            cached_snapshot_id = await self.redis.hget(key, _FIELD_SNAPSHOT_ID)  # ty:ignore[invalid-await]

            if cached_snapshot_id is None:
                logger.debug(f"Cache miss: {key}")
                return None

            if cached_snapshot_id != snapshot_id:
                logger.debug(f"Cache miss (stale snapshot): {key}")
                return None

            if tracks_json := await self.redis.hget(key, _FIELD_TRACKS):  # ty:ignore[invalid-await]
                tracks = json.loads(tracks_json)
                logger.debug(f"Cache hit: {key}")
                return [SpotifyPlaylistTrack.model_validate(t) for t in tracks]

        return None

    # --- Setters ---

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set_model(
            session, _SESSIONS_KEY, session_id, self.settings.ttl_sessions
        )

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set_model(user, _USERS_KEY, user.id, self.settings.ttl_users)

    async def set_playlist(self, playlist: SpotifyPlaylist) -> None:
        await self._set_model(
            playlist, _PLAYLISTS_KEY, playlist.id, self.settings.ttl_playlists
        )

    async def set_user_playlists(
        self, user_id: str, playlists: List[SpotifyPlaylist]
    ) -> None:
        ex = self.settings.ttl_playlists
        playlist_ids = [p.id for p in playlists]
        async with self._error_handler(f"set playlists (user={user_id})"):
            async with self.redis.pipeline() as pipe:
                # store ids and metadata separately to prevent duplicates from collaborative playlists
                pipe.set(
                    self._key(_USER_PLAYLIST_IDS_KEY, user_id),
                    json.dumps(playlist_ids),
                    ex=ex,
                )
                for playlist in playlists:
                    pipe.set(
                        self._key(_PLAYLISTS_KEY, playlist.id),
                        playlist.model_dump_json(),
                        ex=ex,
                    )
                await pipe.execute()
                logger.debug(
                    f"Cached: {len(playlists)} playlists (user={user_id}, ttl={ex}s)"
                )

    async def set_playlist_tracks(
        self, tracks: List[SpotifyPlaylistTrack], *, playlist_id: str, snapshot_id: str
    ) -> None:
        key = self._key(_PLAYLIST_TRACKS_KEY, playlist_id)
        tracks_json = json.dumps([t.model_dump() for t in tracks])
        async with self._error_handler(f"set playlist tracks (playlist={playlist_id})"):
            await self._hset_with_ttl(
                key,
                mapping={_FIELD_SNAPSHOT_ID: snapshot_id, _FIELD_TRACKS: tracks_json},
                ttl=self.settings.ttl_tracks,
            )
            logger.debug(
                f"Cached: {len(tracks)} tracks (playlist={playlist_id}, ttl={self.settings.ttl_tracks}s)"
            )

    # --- Session Lifecycle ---

    async def create_session(self, info: SessionInfo) -> str:
        for _ in range(_SESSION_ID_MAX_ATTEMPTS):
            session_id = token_urlsafe(_SESSION_ID_LENGTH)
            if not await self.redis.exists(self._key(_SESSIONS_KEY, session_id)):
                break  # id is unique
        else:
            raise RuntimeError("Failed to generate a unique session ID")

        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def end_session(self, session_id: str) -> None:
        async with self._error_handler("end session"):
            await self.redis.delete(self._key(_SESSIONS_KEY, session_id))
        logger.info(f"Ended session: {session_id}")

    # --- Helpers ---

    async def _get_user_playlist_ids(self, user_id: str) -> Optional[List[str]]:
        """Get the IDs of playlists owned by a user."""
        playlist_ids = await self._get(self._key(_USER_PLAYLIST_IDS_KEY, user_id))
        return json.loads(playlist_ids) if playlist_ids else None

    async def _get_playlists(
        self, playlist_ids: List[str]
    ) -> Optional[List[SpotifyPlaylist]]:
        """Get playlists by ID. Returns None if any given ID is stale."""
        playlist_keys = [self._key(_PLAYLISTS_KEY, p_id) for p_id in playlist_ids]
        playlists = await self.redis.mget(playlist_keys)
        if None in playlists:
            return None  # stale
        return [SpotifyPlaylist.model_validate_json(p) for p in playlists]

    async def _get_model(
        self, model: Type[M], resource: str, resource_id: str
    ) -> Optional[M]:
        """Fetch a JSON-serialized Pydantic model."""
        data = await self._get(self._key(resource, resource_id))
        return model.model_validate_json(data) if data else None

    async def _set_model(
        self, instance: M, resource: str, resource_id: str, ttl: int
    ) -> None:
        """Serialize a Pydantic model to JSON and store it."""
        await self._set(
            self._key(resource, resource_id), instance.model_dump_json(), ttl
        )

    async def _hset_with_ttl(self, key: str, mapping: dict, ttl: int) -> None:
        """Write a hash and set its TTL atomically."""
        async with self.redis.pipeline() as pipe:
            pipe.hset(key, mapping=mapping)
            pipe.expire(key, ttl)
            await pipe.execute()

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
    def _key(resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
