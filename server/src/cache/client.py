import json
from contextlib import asynccontextmanager
from pydantic import BaseModel
from settings import RedisSettings
from typing import Optional, TypeVar, Type, List
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
        return await self._get(self._get_user_key(user_id), SpotifyCurrentUser)

    async def set_user(self, user: SpotifyCurrentUser) -> None:
        await self._set(self._get_user_key(user.id), user, self.settings.ttl_users)

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(32)
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._set(
            self._get_session_key(session_id), session, self.settings.ttl_sessions
        )

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self._get(self._get_session_key(session_id), SessionInfo)

    async def end_session(self, session_id: str) -> None:
        session_key = self._get_session_key(session_id)
        async with self._error_handler("end session"):
            await self.redis.delete(session_key)
        logger.info(f"Ended session: {session_id}")

    async def get_playlist(self, playlist_id: str) -> Optional[SpotifyPlaylist]:
        return await self._get(self._get_playlist_key(playlist_id), SpotifyPlaylist)

    async def set_playlist(self, playlist: SpotifyPlaylist) -> None:
        await self._set(
            self._get_playlist_key(playlist.id), playlist, self.settings.ttl_playlists
        )

    async def get_playlist_ids(self, user_id: str) -> Optional[List[str]]:
        playlist_ids_key = self._get_playlist_ids_key(user_id)
        async with self._error_handler(f"get {playlist_ids_key}"):
            data = await self.redis.get(playlist_ids_key)
            if data:
                logger.debug(f"Cache hit: {playlist_ids_key}")
                return json.loads(data)
            logger.debug(f"Cache miss: {playlist_ids_key}")
            return None

    async def set_playlist_ids(self, user_id: str, playlist_ids: List[str]) -> None:
        await self._set(
            self._get_playlist_ids_key(user_id),
            json.dumps(playlist_ids),
            self.settings.ttl_playlists,
        )

    async def get_playlists_by_ids(
        self, playlist_ids: List[str]
    ) -> Optional[List[SpotifyPlaylist]]:
        playlist_keys = [self._get_playlist_key(p_id) for p_id in playlist_ids]
        async with self._error_handler("mget playlists"):
            playlists = await self.redis.mget(playlist_keys)
        if None in playlists:
            return None  # stale, at least one playlist missing
        return [SpotifyPlaylist.model_validate_json(r) for r in playlists]

    async def set_user_playlists(
        self, user_id: str, playlists: List[SpotifyPlaylist]
    ) -> None:
        async with self._error_handler(f"set user playlists: {user_id}"):
            async with self.redis.pipeline() as pipe:
                pipe.set(
                    self._get_playlist_ids_key(user_id),
                    json.dumps([p.id for p in playlists]),
                    ex=self.settings.ttl_playlists,
                )
                for playlist in playlists:
                    pipe.set(
                        self._get_playlist_key(playlist.id),
                        playlist.model_dump_json(),
                        ex=self.settings.ttl_playlists,
                    )
                await pipe.execute()
        logger.debug(f"Cached {len(playlists)} playlists for user: {user_id}")

    async def _get(self, key: str, model: Type[T]) -> Optional[T]:
        async with self._error_handler(f"get {key}"):
            data = await self.redis.get(key)
            if data:
                logger.debug(f"Cache hit: {key}")
                return model.model_validate_json(data)
            logger.debug(f"Cache miss: {key}")
            return None

    async def _set(self, key: str, value: BaseModel | str, ex: int) -> None:
        if isinstance(value, BaseModel):
            value = value.model_dump_json()
        async with self._error_handler(f"set {key}"):
            await self.redis.set(key, value, ex=ex)
        logger.debug(f"Cached: {key} (ttl={ex}s)")

    def _get_session_key(self, session_id: str) -> str:
        return self._format_key("sessions", session_id)

    def _get_user_key(self, user_id: str) -> str:
        return self._format_key("users", user_id)

    def _get_playlist_key(self, playlist_id: str) -> str:
        return self._format_key("playlists", playlist_id)

    def _get_playlist_ids_key(self, user_id: str) -> str:
        return self._format_key("playlistIds", user_id)

    def _format_key(self, resource: str, resource_id: str) -> str:
        return f"{resource}:{resource_id}"

    @asynccontextmanager
    async def _error_handler(self, operation: str):
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
