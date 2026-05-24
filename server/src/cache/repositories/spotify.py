from settings import RedisSettings
from typing import Optional, List
from secrets import token_urlsafe
from loguru import logger
from cache import RedisCore
from models import (
    SessionInfo,
    CurrentUser,
    Playlist,
    PlaylistItem,
    PlaylistItems,
)

_SESSION_ID_LEN = 32


class SpotifyCache:
    def __init__(self, core: RedisCore, settings: RedisSettings):
        self.core = core
        self.settings = settings

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LEN)
        await self.set_session(session_id, info)
        logger.info(f"Created session: {session_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self.core.set_model_secure(
            session,
            self._session_key(session_id),
            self.settings.ttl_sessions,
        )

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        return await self.core.get_model_secure(
            SessionInfo, self._session_key(session_id)
        )

    async def end_session(self, session_id: str) -> None:
        await self.core.delete(self._session_key(session_id))
        logger.info(f"Ended session: {session_id}")

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        return await self.core.get_model(CurrentUser, self._user_key(user_id))

    async def set_user(self, user: CurrentUser) -> None:
        await self.core.set_model(
            user, self._user_key(user.id), self.settings.ttl_users
        )

    async def get_playlist(self, user_id: str, playlist_id: str) -> Optional[Playlist]:
        return await self.core.hget_model(
            Playlist, self._playlists_key(user_id), playlist_id
        )

    async def get_playlists(self, user_id: str) -> Optional[List[Playlist]]:
        return await self.core.hgetall_models(Playlist, self._playlists_key(user_id))

    async def set_playlists(self, user_id: str, playlists: List[Playlist]) -> None:
        await self.core.hset_models(
            self._playlists_key(user_id),
            {p.id: p for p in playlists},
            self.settings.ttl_playlists,
        )

    async def invalidate_playlist(self, user_id: str, playlist_id: str) -> None:
        await self.core.delete(
            self._playlists_key(user_id),
            self._playlist_items_key(user_id, playlist_id),
            self._playlist_snapshot_key(user_id, playlist_id),
        )

    async def invalidate_playlists(self, user_id: str) -> None:
        await self.core.delete(self._playlists_key(user_id))

    async def get_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> Optional[PlaylistItems]:
        snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
        items_key = self._playlist_items_key(user_id, playlist_id)

        async with self.core.redis.pipeline() as pipe:
            pipe.get(snapshot_key)
            pipe.lrange(items_key, start=offset, end=offset + limit - 1)
            pipe.llen(items_key)
            cached_snapshot_id, page, total = await pipe.execute()

        if snapshot_id != cached_snapshot_id:
            logger.debug(f"MISS: {items_key}")
            return None

        logger.debug(f"HIT: {items_key}")
        return PlaylistItems(
            items=[PlaylistItem.model_validate_json(item) for item in page],
            total=total,
            has_more=offset + limit < total,
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
        ttl = self.settings.ttl_playlist_items

        async with self.core.redis.pipeline() as pipe:
            pipe.delete(items_key)
            pipe.rpush(items_key, *[t.model_dump_json() for t in items])
            pipe.expire(items_key, ttl)
            pipe.set(snapshot_key, snapshot_id, ex=ttl)
            await pipe.execute()

        logger.debug(f"CACHED: {len(items)} items (key={items_key}, ttl={ttl}s)")

    @staticmethod
    def _session_key(session_id: str) -> str:
        """sessions:{session_id}"""
        return RedisCore.key("sessions", session_id)

    @staticmethod
    def _user_key(user_id: str) -> str:
        """users:{user_id}"""
        return RedisCore.key("users", user_id)

    @staticmethod
    def _playlists_key(user_id: str) -> str:
        """users:{user_id}:playlists"""
        return RedisCore.key(SpotifyCache._user_key(user_id), "playlists")

    @staticmethod
    def _playlist_items_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:items"""
        return RedisCore.key(SpotifyCache._playlists_key(user_id), playlist_id, "items")

    @staticmethod
    def _playlist_snapshot_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:snapshot"""
        return RedisCore.key(
            SpotifyCache._playlists_key(user_id), playlist_id, "snapshot"
        )
