from secrets import token_urlsafe

from cryptography.fernet import Fernet
from loguru import logger
from pydantic import TypeAdapter

from src.cache.client import RedisClient
from src.cache.codec import Codec
from src.services.spotify.models import CurrentUser, Playlist, SessionInfo, Track
from src.settings import Settings

_SESSION_ID_LEN = 32
_TRACKS = TypeAdapter(list[Track])


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
        self._codec = Codec(Fernet(redis_key))
        self._ttl_sessions = ttl_sessions
        self._ttl_users = ttl_users
        self._ttl_playlists = ttl_playlists
        self._ttl_playlist_tracks = ttl_playlist_tracks

    async def create_session(self, session: SessionInfo) -> str:
        session_id = token_urlsafe(_SESSION_ID_LEN)
        await self.set_session(session_id, session)
        logger.info(f"Created session for user: {session.user_id}")
        return session_id

    async def set_session(self, session_id: str, session: SessionInfo) -> None:
        await self._client.set(
            self._build_session_key_from_id(session_id),
            self._codec.model(SessionInfo).encrypt(session),
            self._ttl_sessions,
        )
        await self._client.sadd(
            self._build_session_key_from_email(session.email),
            session_id,
            self._ttl_sessions,
        )

    async def get_session(self, session_id: str) -> SessionInfo | None:
        session = await self._client.get(self._build_session_key_from_id(session_id))
        return self._codec.model(SessionInfo).decrypt(session) if session else None

    async def end_session(self, session_id: str, user_id: str, email: str) -> None:
        await self._client.delete(
            self._build_session_key_from_id(session_id),
            *self._build_user_keys(user_id),
        )
        await self._client.srem(self._build_session_key_from_email(email), session_id)
        logger.info(f"Ended session for email: {email}")

    async def end_all_sessions(self, email: str) -> None:
        email_to_sessions_key = self._build_session_key_from_email(email)
        session_ids = await self._client.smembers(email_to_sessions_key)
        if not session_ids:
            logger.warning(f"No sessions found for email: {email}")
            return

        session_keys = [self._build_session_key_from_id(session_id) for session_id in session_ids]  # fmt: skip
        user_keys = []

        for session_id in session_ids:
            session = await self.get_session(session_id)
            if not session:
                continue
            user_keys.extend(self._build_user_keys(session.user_id))

        await self._client.delete(*session_keys, *user_keys, email_to_sessions_key)
        logger.info(f"Ended all sessions for email: {email}")

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
    ) -> list[Track] | None:
        tracks = await self._client.hget(
            self._build_playlist_tracks_key(user_id),
            self._build_playlist_snapshot_key(playlist_id, snapshot_id),
        )
        return _TRACKS.validate_json(tracks) if tracks else None

    async def set_playlist_tracks(
        self, user_id: str, playlist_id: str, snapshot_id: str, tracks: list[Track]
    ) -> None:
        await self._client.hset(
            self._build_playlist_tracks_key(user_id),
            self._build_playlist_snapshot_key(playlist_id, snapshot_id),
            _TRACKS.dump_json(tracks).decode(),
            self._ttl_playlist_tracks,
        )

    @staticmethod
    def _build_session_key_from_id(session_id: str) -> str:
        """sessions:from_id:{session_id}"""
        return RedisClient.key("sessions", "from_id", session_id)

    @staticmethod
    def _build_session_key_from_email(email: str) -> str:
        """sessions:from_email:{email}"""
        return RedisClient.key("sessions", "from_email", email)

    @staticmethod
    def _build_user_key(user_id: str) -> str:
        """users:{user_id}"""
        return RedisClient.key("users", user_id)

    @staticmethod
    def _build_playlists_key(user_id: str) -> str:
        """users:{user_id}:playlists"""
        return RedisClient.key(SpotifyCache._build_user_key(user_id), "playlists")

    @staticmethod
    def _build_playlist_tracks_key(user_id: str) -> str:
        """users:{user_id}:playlists:tracks"""
        return RedisClient.key(SpotifyCache._build_playlists_key(user_id), "tracks")

    @staticmethod
    def _build_playlist_snapshot_key(playlist_id: str, snapshot_id: str) -> str:
        """playlistId:snapshotId"""
        return RedisClient.key(playlist_id, snapshot_id)

    @staticmethod
    def _build_user_keys(user_id: str) -> list[str]:
        return [
            SpotifyCache._build_user_key(user_id),
            SpotifyCache._build_playlists_key(user_id),
            SpotifyCache._build_playlist_tracks_key(user_id),
        ]


def build_spotify_cache(redis: RedisClient, settings: Settings) -> SpotifyCache:
    """Build a SpotifyCache wired to Redis and the app settings."""
    return SpotifyCache(
        redis=redis,
        redis_key=settings.redis_key,
        ttl_sessions=settings.ttl_sessions,
        ttl_users=settings.ttl_users,
        ttl_playlists=settings.ttl_playlists,
        ttl_playlist_tracks=settings.ttl_playlist_tracks,
    )
