from typing import Protocol

from cryptography.fernet import Fernet
from errors import SpotifyTokenError
from loguru import logger
from models.spotify import SpotifyTokenResponse
from redis.asyncio import Redis
from services.spotify.http import SpotifyHttpClient
from settings import settings


class TokenCipher(Protocol):
    """Structural interface for token encryption."""

    def encrypt(self, data: bytes) -> bytes: ...

    def decrypt(self, token: str | bytes) -> bytes: ...


class SpotifyTokenProvider:
    """A class to provide access tokens for Spotify's user management API."""

    def __init__(
        self,
        http: SpotifyHttpClient,
        redis: Redis,
        crypto: TokenCipher,
        auth_client_id: str,
    ):
        self._http = http
        self._redis = redis
        self._crypto = crypto
        self._auth_client_id = auth_client_id
        self._token_url = "https://accounts.spotify.com/api/token"
        self._access_token_key = "queue:access_token"
        self._refresh_token_key = "queue:refresh_token"

    async def seed_token(self, refresh_token: str) -> None:
        """Seed the refresh token into Redis if it doesn't already exist."""
        if await self._redis.exists(self._refresh_token_key):
            logger.warning("Refresh token already exists - no action taken.")
            return

        try:
            token = await self._renew_token(refresh_token)
            await self._persist_token(token)
            logger.success("Seeded refresh token.")
        except Exception as e:
            raise SpotifyTokenError(
                "Failed to seed refresh token. Please renew your app's Spotify credentials."
            ) from e

    async def get_token(self) -> str:
        """Get a valid access token for Spotify's user management API."""
        stored_access_token = await self._retrieve_token(self._access_token_key)
        if stored_access_token is not None:
            return stored_access_token

        refresh_token = await self._retrieve_token(self._refresh_token_key)
        if refresh_token is None:
            raise SpotifyTokenError("No refresh token available to renew access token.")

        try:
            renewed_token = await self._renew_token(refresh_token)
            await self._persist_token(renewed_token)
            logger.debug("Renewed access token using refresh token.")
            return renewed_token.access_token
        except Exception as e:
            raise SpotifyTokenError(
                "Failed to renew access token. Please renew your app's Spotify credentials."
            ) from e

    async def _renew_token(self, refresh_token: str) -> SpotifyTokenResponse:
        """Renew the access token using the refresh token."""
        async with self._http.post(
            self._token_url,
            raise_for_status=True,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self._auth_client_id,
            },
        ) as response:
            return SpotifyTokenResponse.model_validate(await response.json())

    async def _persist_token(self, token: SpotifyTokenResponse) -> None:
        """Save the access and refresh tokens to Redis."""
        ttl = max(token.expires_in - 60, 1)  # expire early, must stay positive
        await self._redis.set(
            self._access_token_key, self._encrypt(token.access_token), ex=ttl
        )
        await self._redis.set(
            self._refresh_token_key, self._encrypt(token.refresh_token)
        )
        logger.debug(f"Stored access token (ttl={ttl}s) and refresh token.")

    async def _retrieve_token(self, key: str) -> str | None:
        """Retrieve and decrypt a token from Redis."""
        encrypted = await self._redis.get(key)
        if encrypted is None:
            return None
        return self._decrypt(encrypted)

    def _encrypt(self, plaintext: str) -> str:
        return self._crypto.encrypt(plaintext.encode()).decode()

    def _decrypt(self, encrypted: str | bytes) -> str:
        return self._crypto.decrypt(encrypted).decode()


def build_spotify_token_provider(
    http: SpotifyHttpClient,
    redis: Redis,
) -> SpotifyTokenProvider:
    """Build a SpotifyTokenProvider wired to real encryption and app settings."""
    return SpotifyTokenProvider(
        http=http,
        redis=redis,
        crypto=Fernet(settings.redis_key),
        auth_client_id=settings.spotify_auth_client_id,
    )
