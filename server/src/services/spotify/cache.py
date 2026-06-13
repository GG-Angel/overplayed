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
        self.redis = redis
        self.ttl_sessions = ttl_sessions

        self.ttl_users: int = 60 * 60 * 2
        self.ttl_playlists: int = 60 * 2
        self.ttl_playlist_items: int = 60 * 60 * 24 * 7

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LEN)
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self.redis.set_model_secure(
            session, self._session_key(session_id), self.ttl_sessions
        )

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self.redis.get_model_secure(
            SessionInfo, self._session_key(session_id)
        )

    async def end_session(self, session_id: str) -> None:
        await self.redis.delete(self._session_key(session_id))
        logger.info(f"Ended session: {session_id}")

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        return await self.redis.get_model(CurrentUser, self._user_key(user_id))

    async def set_user(self, user: CurrentUser) -> None:
        await self.redis.set_model(user, self._user_key(user.id), self.ttl_users)

    async def get_playlist(self, user_id: str, playlist_id: str) -> Optional[Playlist]:
        return await self.redis.hget_model(
            Playlist, self._playlists_key(user_id), playlist_id
        )

    async def get_playlists(self, user_id: str) -> Optional[List[Playlist]]:
        return await self.redis.hgetall_models(Playlist, self._playlists_key(user_id))

    async def set_playlists(self, user_id: str, playlists: List[Playlist]) -> None:
        await self.redis.hset_models(
            self._playlists_key(user_id),
            {p.id: p for p in playlists},
            self.ttl_playlists,
        )

    async def invalidate_playlist(self, user_id: str, playlist_id: str) -> None:
        await self.redis.delete(
            self._playlists_key(user_id),
            self._playlist_items_key(user_id, playlist_id),
            self._playlist_snapshot_key(user_id, playlist_id),
        )

    async def invalidate_playlists(self, user_id: str) -> None:
        await self.redis.delete(self._playlists_key(user_id))

    async def get_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> Optional[PlaylistPage]:
        snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
        items_key = self._playlist_items_key(user_id, playlist_id)

        async with self.redis.redis.pipeline() as pipe:
            pipe.get(snapshot_key)
            pipe.lrange(items_key, start=offset, end=offset + limit - 1)
            pipe.llen(items_key)
            cached_snapshot_id, items, total_items = await pipe.execute()

        if snapshot_id != cached_snapshot_id:
            logger.debug(f"MISS: {items_key}")
            return None

        logger.debug(f"HIT: {items_key}")

        page = [PlaylistItem.model_validate_json(item) for item in items]
        has_more = offset + len(page) < total_items

        return PlaylistPage(
            items=page,
            metadata=PlaylistPageMetadata(
                total_items=total_items,
                has_more=has_more,
                next_offset=offset + len(page) if has_more else None,
            ),
        )

    async def set_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        items: List[PlaylistItem],
    ) -> None:
        items_key = self._playlist_items_key(user_id, playlist_id)
        snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
        ttl = self.ttl_playlist_items

        async with self.redis.redis.pipeline() as pipe:
            pipe.delete(items_key)
            pipe.rpush(items_key, *[t.model_dump_json() for t in items])
            pipe.expire(items_key, ttl)
            pipe.set(snapshot_key, snapshot_id, ex=ttl)
            await pipe.execute()

        logger.debug(f"CACHED: {len(items)} items (key={items_key}, ttl={ttl}s)")

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
    def _playlist_items_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:items"""
        return RedisClient.key(
            SpotifyCache._playlists_key(user_id), playlist_id, "items"
        )

    @staticmethod
    def _playlist_snapshot_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:snapshot"""
        return RedisClient.key(
            SpotifyCache._playlists_key(user_id), playlist_id, "snapshot"
        )
