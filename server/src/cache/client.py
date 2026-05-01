import json
from contextlib import asynccontextmanager
from settings import RedisSettings
from typing import Optional, List
from redis import RedisError
from secrets import token_urlsafe
from models import SessionInfo, SpotifyCurrentUser, SpotifyPlaylist
from redis.asyncio import Redis
from loguru import logger

SESSIONS_KEY = "sessions"
USERS_KEY = "users"
PLAYLISTS_KEY = "playlists"
PLAYLIST_IDS_KEY = "playlistIds"


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        session = await self._get(self._get_key(SESSIONS_KEY, session_id))
        return SessionInfo.model_validate_json(session) if session else None

    async def get_user(self, user_id: str) -> Optional[SpotifyCurrentUser]:
        user = await self._get(self._get_key(USERS_KEY, user_id))
        return SpotifyCurrentUser.model_validate_json(user) if user else None

    async def get_playlist(self, playlist_id: str) -> Optional[SpotifyPlaylist]:
        playlist = await self._get(self._get_key(PLAYLISTS_KEY, playlist_id))
        return SpotifyPlaylist.model_validate_json(playlist) if playlist else None

    async def _get_playlist_ids(self, user_id: str) -> Optional[List[str]]:
        """Get the IDs of playlists owned by a user."""
        playlist_ids = await self._get(self._get_key(PLAYLIST_IDS_KEY, user_id))
        return json.loads(playlist_ids) if playlist_ids else None

    async def _get_playlists(
        self, playlist_ids: List[str]
    ) -> Optional[List[SpotifyPlaylist]]:
        """Get playlists by ID. Returns None if any given ID is stale."""
        playlist_keys = [self._get_key(PLAYLISTS_KEY, p_id) for p_id in playlist_ids]
        playlists = await self.redis.mget(playlist_keys)
        if None in playlists:
            return None  # stale
        return [SpotifyPlaylist.model_validate_json(p) for p in playlists]

    async def get_user_playlists(self, user_id: str) -> Optional[List[SpotifyPlaylist]]:
        """Get all playlists owned by a user. Returns None if any playlist is stale."""
        if playlist_ids := await self._get_playlist_ids(user_id):
            if playlists := await self._get_playlists(playlist_ids):
                return playlists
        return None

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set(
            self._get_key(SESSIONS_KEY, session_id),
            session.model_dump_json(),
            self.settings.ttl_sessions,
        )

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set(
            self._get_key(USERS_KEY, user.id),
            user.model_dump_json(),
            self.settings.ttl_users,
        )

    async def set_playlist(self, playlist: SpotifyPlaylist) -> None:
        await self._set(
            self._get_key(PLAYLISTS_KEY, playlist.id),
            playlist.model_dump_json(),
            self.settings.ttl_playlists,
        )

    async def set_user_playlists(
        self, user_id: str, playlists: List[SpotifyPlaylist]
    ) -> None:
        """Set a user's playlists, storing IDs and metadata separately to prevent collab duplicates."""
        ex = self.settings.ttl_playlists
        playlist_ids = [p.id for p in playlists]
        async with self._error_handler(f"set playlists (user={user_id})"):
            async with self.redis.pipeline() as pipe:
                # store owned playlist ids
                pipe.set(
                    self._get_key(PLAYLIST_IDS_KEY, user_id),
                    json.dumps(playlist_ids),
                    ex=ex,
                )
                # store playlists
                for playlist in playlists:
                    pipe.set(
                        self._get_key(PLAYLISTS_KEY, playlist.id),
                        playlist.model_dump_json(),
                        ex=ex,
                    )
                await pipe.execute()
                logger.debug(
                    f"Cached: {len(playlists)} playlists (user={user_id}, ttl={ex}s)"
                )

    async def create_session(self, info: SessionInfo) -> str:
        """Initializes a session and returns a unique ID for authentication by the client."""
        while True:
            session_id = token_urlsafe(32)
            if not await self.redis.exists(self._get_key(SESSIONS_KEY, session_id)):
                break  # id is unique
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def end_session(self, session_id: str) -> None:
        async with self._error_handler("end session"):
            await self.redis.delete(self._get_key(SESSIONS_KEY, session_id))
        logger.info(f"Ended session: {session_id}")

    async def _get(self, key: str) -> Optional[str]:
        async with self._error_handler(f"get {key}"):
            data = await self.redis.get(key)
            if data:
                logger.debug(f"Cache hit: {key}")
                return data
            else:
                logger.debug(f"Cache miss: {key}")
                return None

    async def _set(self, key: str, value: str, ex: int) -> None:
        async with self._error_handler(f"set {key}"):
            await self.redis.set(key, value, ex=ex)
            logger.debug(f"Cached: {key} (ttl={ex}s)")

    def _get_key(self, resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
