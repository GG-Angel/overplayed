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
    def __init__(self, redis: RedisClient, ttl_sessions: int):
        self.client = redis
        self.ttl_sessions = ttl_sessions
        self.ttl_users: int = 60 * 60 * 2
        self.ttl_playlists: int = 90
        self.ttl_playlist_items: int = 60 * 60

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LEN)
        await self.set_session(session_id, info)
        logger.info(f"Created session for user: {info.user_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self.client.set_model_secure(
            session, self._session_key(session_id), self.ttl_sessions
        )

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self.client.get_model_secure(
            SessionInfo, self._session_key(session_id)
        )

    async def end_session(self, session_id: str) -> None:
        await self.client.delete(self._session_key(session_id))
        logger.info(f"Ended session: {session_id}")

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        return await self.client.get_model(CurrentUser, self._user_key(user_id))

    async def set_user(self, user: CurrentUser) -> None:
        await self.client.set_model(user, self._user_key(user.id), self.ttl_users)

    async def get_playlist(self, user_id: str, playlist_id: str) -> Optional[Playlist]:
        return await self.client.hget_model(
            Playlist, self._playlists_key(user_id), playlist_id
        )

    async def get_playlists(self, user_id: str) -> Optional[List[Playlist]]:
        return await self.client.hgetall_models(Playlist, self._playlists_key(user_id))

    async def set_playlists(self, user_id: str, playlists: List[Playlist]) -> None:
        await self.client.hset_models(
            self._playlists_key(user_id),
            {p.id: p for p in playlists},
            self.ttl_playlists,
        )

    async def invalidate_playlists(self, user_id: str) -> None:
        await self.client.delete(self._playlists_key(user_id))

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
        async with self.client.redis.pipeline() as pipe:
            pipe.exists(key)
            pipe.lrange(key, start=offset, end=offset + limit - 1)
            pipe.llen(key)
            pipe.expire(key, self.ttl_playlist_items)
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
        ttl = self.ttl_playlist_items
        async with self.client.redis.pipeline() as pipe:
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
