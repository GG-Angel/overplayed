from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cache.codec import Codec
from cache.client import RedisClient
from typing import Optional, List
from secrets import token_urlsafe
from loguru import logger
from services.spotify.models import (
    CurrentUser,
    Playlist,
    PlaylistItem,
    PlaylistPage,
    SessionInfo,
    PlaylistPageMetadata,
)

_SESSION_ID_LEN = 32


class SpotifyCache:
    def __init__(
        self,
        redis: RedisClient,
        redis_key: bytes,
        ttl_sessions: int,
        ttl_users: int,
        ttl_playlists: int,
        ttl_playlist_items: int,
    ):
        self._client = redis
        self._codec = Codec(AESGCM(redis_key))
        self._ttl_sessions = ttl_sessions
        self._ttl_users = ttl_users
        self._ttl_playlists = ttl_playlists
        self._ttl_playlist_items = ttl_playlist_items

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LEN)
        await self.set_session(session_id, info)
        logger.info(f"Created session for user: {info.user_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._client.set(
            self._session_key(session_id),
            self._codec.model(SessionInfo).encrypt(session),
            self._ttl_sessions,
        )

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        session = await self._client.get(self._session_key(session_id))
        return self._codec.model(SessionInfo).decrypt(session) if session else None

    async def end_session(self, session_id: str) -> None:
        await self._client.delete(self._session_key(session_id))
        logger.info(f"Ended session: {session_id}")

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        user = await self._client.get(self._user_key(user_id))
        return CurrentUser.model_validate_json(user) if user else None

    async def set_user(self, user: CurrentUser) -> None:
        await self._client.set(
            self._user_key(user.id),
            user.model_dump_json(),
            self._ttl_users,
        )

    async def get_playlist(self, user_id: str, playlist_id: str) -> Optional[Playlist]:
        playlist = await self._client.hget(self._playlists_key(user_id), playlist_id)
        return Playlist.model_validate_json(playlist) if playlist else None

    async def get_playlists(self, user_id: str) -> Optional[List[Playlist]]:
        playlists = await self._client.hgetall(self._playlists_key(user_id))
        if playlists is None:
            return None
        return [Playlist.model_validate_json(p) for p in playlists]

    async def set_playlists(self, user_id: str, playlists: List[Playlist]) -> None:
        await self._client.hsetall(
            self._playlists_key(user_id),
            {playlist.id: playlist.model_dump_json() for playlist in playlists},
            self._ttl_playlists,
        )

    async def invalidate_playlists(self, user_id: str) -> None:
        await self._client.delete(self._playlists_key(user_id))

    async def get_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> Optional[PlaylistPage]:
        if offset < 0 or limit < 0:
            raise ValueError("Offset and limit must be positive.")

        key = self._playlist_items_key(user_id, playlist_id, snapshot_id)
        async with self._client.redis.pipeline() as pipe:
            pipe.exists(key)
            pipe.lrange(key, start=offset, end=offset + limit - 1)
            pipe.llen(key)
            pipe.expire(key, self._ttl_playlist_items)
            is_cached, items_raw, total, _ = await pipe.execute()

        if not is_cached:
            logger.debug(f"MISS: {key}")
            return None
        logger.debug(f"HIT: {key}")

        items = [PlaylistItem.model_validate_json(item) for item in items_raw]
        next_offset = offset + len(items)
        has_more = next_offset < total

        return PlaylistPage(
            items=items,
            metadata=PlaylistPageMetadata(
                total_items=total,
                has_more=has_more,
                next_offset=next_offset if has_more else None,
            ),
        )

    async def set_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        items: List[PlaylistItem],
    ) -> None:
        if not items:
            raise ValueError("Caching an empty list of playlist items is prohibited.")

        key = self._playlist_items_key(user_id, playlist_id, snapshot_id)
        ttl = self._ttl_playlist_items
        async with self._client.redis.pipeline() as pipe:
            pipe.delete(key)
            pipe.rpush(key, *[item.model_dump_json() for item in items])
            pipe.expire(key, ttl)
            await pipe.execute()

        logger.debug(f"CACHED: {len(items)} playlist items (key={key}, snapshot={snapshot_id}, ttl={ttl})")  # fmt: skip

    @staticmethod
    def _session_key(session_id: str) -> str:
        """sessions:{session_id}"""
        return RedisClient.key("sessions", session_id)

    @staticmethod
    def _user_key(user_id: str) -> str:
        """users:{user_id}"""
        return RedisClient.key("users", user_id)

    @staticmethod
    def _playlists_key(user_id: str) -> str:
        """users:{user_id}:playlists"""
        return RedisClient.key(SpotifyCache._user_key(user_id), "playlists")

    @staticmethod
    def _playlist_items_key(user_id: str, playlist_id: str, snapshot_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:items:{snapshot_id}"""
        return RedisClient.key(
            SpotifyCache._playlists_key(user_id), playlist_id, "items", snapshot_id
        )
