from os import urandom
from base64 import b64encode, b64decode
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from contextlib import asynccontextmanager
from pydantic import BaseModel
from redis.asyncio import Redis, RedisError
from settings import RedisSettings
from typing import Optional, List, TypeVar, Type, Literal, AsyncIterator
from secrets import token_urlsafe
from loguru import logger
from models import (
    SessionInfo,
    CurrentUser,
    Playlist,
    PlaylistItem,
    PlaylistItems,
)

_SESSIONS_KEY = "sessions"
_USERS_KEY = "users"
_PLAYLISTS_KEY = "playlists"
_ITEMS_KEY = "items"
_SNAPSHOT_KEY = "snapshot"
_PREVIEWS_KEY = "previews"

_SESSION_ID_LENGTH = 32

M = TypeVar("M", bound=BaseModel)


class RedisClient:
    def __init__(self, redis: Redis, settings: RedisSettings):
        self.redis = redis
        self.settings = settings
        self.aesgcm = AESGCM(settings.encryption_key)

    async def get_session(self, session_id: str) -> Optional[SessionInfo]:
        async with self._handle_error("get session"):
            encrypted = await self._get(self._session_key(session_id))
            if not encrypted:
                return None

            decrypted = self._decrypt(encrypted)
            return SessionInfo.model_validate_json(decrypted)

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        async with self._handle_error("get user"):
            return await self._get_model(CurrentUser, self._user_key(user_id))

    async def get_playlist(self, user_id: str, playlist_id: str) -> Optional[Playlist]:
        async with self._handle_error("get playlist"):
            key = self._playlists_key(user_id)

            playlist = await self.redis.hget(key, playlist_id)  # ty:ignore[invalid-await]
            if not playlist:
                logger.debug(f"MISS: {key} (id={playlist_id})")
                return None

            logger.debug(f"HIT: {key} (id={playlist_id})")
            return Playlist.model_validate_json(playlist)

    async def get_playlists(self, user_id: str) -> Optional[List[Playlist]]:
        async with self._handle_error("get playlists"):
            key = self._playlists_key(user_id)

            playlist_map = await self.redis.hgetall(key)  # ty:ignore[invalid-await]
            if not playlist_map:
                logger.debug(f"MISS: {key} (no playlists)")
                return None

            logger.debug(f"HIT: {key} (all playlists)")
            return [Playlist.model_validate_json(p) for p in playlist_map.values()]

    async def get_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> Optional[PlaylistItems]:
        async with self._handle_error("get playlist items"):
            snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
            items_key = self._playlist_items_key(user_id, playlist_id)

            async with self.redis.pipeline() as pipe:
                pipe.get(snapshot_key)
                pipe.exists(items_key)
                pipe.lrange(items_key, start=offset, end=offset + limit - 1)
                pipe.llen(items_key)
                cached_snapshot_id, hit, page, total = await pipe.execute()

            if not hit or cached_snapshot_id != snapshot_id:
                logger.debug(f"MISS: {items_key}")
                return None

            logger.debug(f"HIT: {items_key}")
            return PlaylistItems(
                items=[PlaylistItem.model_validate_json(item) for item in page],
                total=total,
                has_more=offset + limit < total,
            )

    async def get_track_preview_url(
        self, isrc: str
    ) -> str | Literal["NO_PREVIEW"] | None:
        async with self._handle_error("get track preview"):
            return await self._get(self._track_preview_key(isrc))

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        async with self._handle_error("set session"):
            plaintext = session.model_dump_json()
            encrypted = self._encrypt(plaintext)
            await self._set(
                self._session_key(session_id), encrypted, self.settings.ttl_sessions
            )

    async def set_user(self, user: CurrentUser) -> None:
        async with self._handle_error("set user"):
            await self._set_model(
                user, self._user_key(user.id), self.settings.ttl_users
            )

    async def set_playlist(self, user_id: str, playlist: Playlist) -> None:
        async with self._handle_error("set playlist"):
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

    async def set_playlists(self, user_id: str, playlists: List[Playlist]) -> None:
        async with self._handle_error("set playlists"):
            key = self._playlists_key(user_id)
            ttl = self.settings.ttl_playlists
            mapping = {p.id: p.model_dump_json() for p in playlists}

            async with self.redis.pipeline() as pipe:
                pipe.delete(key)
                pipe.hset(key, mapping=mapping)
                pipe.expire(key, ttl)
                await pipe.execute()

            logger.debug(f"CACHED: {len(playlists)} playlists (key={key}, ttl={ttl}s)")

    async def set_playlist_items(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        items: List[PlaylistItem],
    ) -> None:
        async with self._handle_error("set playlist items"):
            items_key = self._playlist_items_key(user_id, playlist_id)
            snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)
            ttl = self.settings.ttl_playlist_items
            serialized = [t.model_dump_json() for t in items]

            async with self.redis.pipeline() as pipe:
                pipe.delete(items_key)
                if serialized:
                    pipe.rpush(items_key, *serialized)
                    pipe.expire(items_key, ttl)
                    pipe.set(snapshot_key, snapshot_id, ex=ttl)
                else:
                    pipe.delete(snapshot_key)  # keep snapshot/items in sync
                await pipe.execute()

            logger.debug(f"CACHED: {len(items)} items (key={items_key}, ttl={ttl}s)")

    async def set_track_preview_url(
        self, isrc: str, preview_url: Optional[str]
    ) -> None:
        async with self._handle_error("set track preview"):
            await self._set(
                self._track_preview_key(isrc),
                preview_url if preview_url else "NO_PREVIEW",
                self.settings.ttl_previews_hit
                if preview_url
                else self.settings.ttl_previews_miss,
            )

    async def create_session(self, info: SessionInfo) -> str:
        async with self._handle_error("create session"):
            session_id = token_urlsafe(_SESSION_ID_LENGTH)
            await self.set_session(session_id, info)
            logger.info(f"Created session: {session_id}")
            return session_id

    async def end_session(self, session_id: str) -> None:
        async with self._handle_error("end session"):
            await self.redis.delete(self._session_key(session_id))
            logger.info(f"Ended session: {session_id}")

    async def invalidate_playlist(self, user_id: str, playlist_id: str) -> None:
        async with self._handle_error("invalidate playlist"):
            playlists_key = self._playlists_key(user_id)
            items_key = self._playlist_items_key(user_id, playlist_id)
            snapshot_key = self._playlist_snapshot_key(user_id, playlist_id)

            await self.redis.delete(playlists_key, items_key, snapshot_key)
            logger.debug(f"Invalidated playlist {playlist_id} for user: {user_id}")

    async def invalidate_playlists(self, user_id: str) -> None:
        async with self._handle_error("invalidate playlists"):
            await self.redis.delete(self._playlists_key(user_id))
            logger.debug(f"Invalidated playlists for user: {user_id}")

    async def _get_model(self, model: Type[M], key: str) -> Optional[M]:
        data = await self._get(key)
        return model.model_validate_json(data) if data else None

    async def _set_model(self, instance: M, key: str, ttl: int) -> None:
        await self._set(key, instance.model_dump_json(), ttl)

    async def _get(self, key: str) -> Optional[str]:
        if data := await self.redis.get(key):
            logger.debug(f"HIT: {key}")
            return data
        logger.debug(f"MISS: {key}")
        return None

    async def _set(self, key: str, value: str, ttl: int) -> None:
        await self.redis.set(key, value, ex=ttl)
        logger.debug(f"CACHED: {key} (ttl={ttl}s)")

    def _encrypt(self, plaintext: str) -> str:
        nonce = urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode(), None)
        return b64encode(nonce + ciphertext).decode()

    def _decrypt(self, data: str) -> str:
        raw = b64decode(data.encode())
        nonce, ciphertext = raw[:12], raw[12:]
        plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode()

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
    def _playlist_items_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:items"""
        return RedisClient._key(
            RedisClient._playlists_key(user_id), playlist_id, _ITEMS_KEY
        )

    @staticmethod
    def _playlist_snapshot_key(user_id: str, playlist_id: str) -> str:
        """users:{user_id}:playlists:{playlist_id}:snapshot"""
        return RedisClient._key(
            RedisClient._playlists_key(user_id), playlist_id, _SNAPSHOT_KEY
        )

    @staticmethod
    def _track_preview_key(isrc: str) -> str:
        """previews:{isrc}"""
        return RedisClient._key(_PREVIEWS_KEY, isrc)

    @asynccontextmanager
    async def _handle_error(self, operation: str) -> AsyncIterator[None]:
        try:
            yield
        except RedisError as e:
            logger.error(f"Failed to {operation}: {e}")
            raise
