from secrets import token_urlsafe

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from loguru import logger

from cache.client import RedisClient
from cache.codec import Codec
from services.spotify.models import CurrentUser, Playlist, SessionInfo, Track

_SESSION_ID_LEN = 32


class SpotifyCache:
    def __init__(
        self,
        redis: RedisClient,
        redis_key: bytes,
        *,
        ttl_sessions: int,
        ttl_users: int,
        ttl_playlists: int,
        ttl_playlist_tracks: int,
    ):
        self._client = redis
        self._codec = Codec(AESGCM(redis_key))
        self._ttl_sessions = ttl_sessions
        self._ttl_users = ttl_users
        self._ttl_playlists = ttl_playlists
        self._ttl_playlist_tracks = ttl_playlist_tracks

    async def create_session(self, info: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LEN)
        await self.set_session(session_id, info)
        logger.info(f"Created session for user: {info.user_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._client.set(
            self._build_session_key(session_id),
            self._codec.model(SessionInfo).encrypt(session),
            self._ttl_sessions,
        )

    async def get_session(self, session_id: str) -> SessionInfo | None:
        session = await self._client.get(self._build_session_key(session_id))
        return self._codec.model(SessionInfo).decrypt(session) if session else None

    async def end_session(self, session_id: str) -> None:
        await self._client.delete(self._build_session_key(session_id))
        logger.info(f"Ended session: {session_id}")

    async def get_user(self, user_id: str) -> CurrentUser | None:
        user = await self._client.get(self._build_user_key(user_id))
        return CurrentUser.model_validate_json(user) if user else None

    async def set_user(self, user: CurrentUser) -> None:
        await self._client.set(
            self._build_user_key(user.id),
            user.model_dump_json(),
            self._ttl_users,
        )

    async def get_playlist(self, user_id: str, playlist_id: str) -> Playlist | None:
        playlist = await self._client.hget(
            self._build_playlists_key(user_id), playlist_id
        )
        return Playlist.model_validate_json(playlist) if playlist else None

    async def get_playlists(self, user_id: str) -> list[Playlist] | None:
        playlists = await self._client.hgetall(self._build_playlists_key(user_id))
        if playlists is None:
            return None
        return [Playlist.model_validate_json(p) for p in playlists.values()]

    async def set_playlists(self, user_id: str, playlists: list[Playlist]) -> None:
        await self._client.hsetall(
            self._build_playlists_key(user_id),
            {playlist.id: playlist.model_dump_json() for playlist in playlists},
            self._ttl_playlists,
        )

    async def invalidate_playlists(self, user_id: str) -> None:
        await self._client.delete(self._build_playlists_key(user_id))

    async def get_playlist_tracks(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Track] | None:
        if offset < 0 or limit < 0:
            raise ValueError("Offset and limit must be positive.")

        key = self._build_playlist_tracks_key(user_id, playlist_id, snapshot_id)
        async with self._client.redis.pipeline() as pipe:
            pipe.exists(key)
            pipe.lrange(key, start=offset, end=offset + limit - 1)
            pipe.expire(key, self._ttl_playlist_tracks)
            is_cached, tracks, _ = await pipe.execute()

        if not is_cached:
            logger.debug(f"MISS: {key}")
            return None

        logger.debug(f"HIT: {key}")
        return [Track.model_validate_json(track) for track in tracks]

    async def push_playlist_tracks(
        self,
        user_id: str,
        playlist_id: str,
        snapshot_id: str,
        tracks: list[Track],
    ) -> None:
        key = self._build_playlist_tracks_key(user_id, playlist_id, snapshot_id)
        async with self._client.redis.pipeline() as pipe:
            pipe.rpush(key, *[track.model_dump_json() for track in tracks])
            pipe.expire(key, self._ttl_playlist_tracks)
            await pipe.execute()
        logger.debug(f"CACHED: Pushed {len(tracks)} tracks (key={key}, ttl={self._ttl_playlist_tracks})")  # fmt: skip

    @staticmethod
    def _build_session_key(session_id: str) -> str:
        """sessions:{session_id}"""
        return RedisClient.key("sessions", session_id)

    @staticmethod
    def _build_user_key(user_id: str) -> str:
        """users:{user_id}"""
        return RedisClient.key("users", user_id)

    @staticmethod
    def _build_playlists_key(user_id: str) -> str:
        """users:{user_id}:playlists"""
        return RedisClient.key(SpotifyCache._build_user_key(user_id), "playlists")

    @staticmethod
    def _build_playlist_tracks_key(
        user_id: str, playlist_id: str, snapshot_id: str
    ) -> str:
        """users:{user_id}:playlists:{playlist_id}:tracks:{snapshot_id}"""
        return RedisClient.key(
            SpotifyCache._build_playlists_key(user_id),
            playlist_id,
            "tracks",
            snapshot_id,
        )
