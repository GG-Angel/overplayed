from typing import Protocol

from errors import SpotifyUserManagementError
from loguru import logger
from models.spotify import (
    SpotifyUser,
    SpotifyUserCreationRequest,
    SpotifyUsersResponse,
)
from redis.asyncio import Redis
from services.spotify.http import SpotifyHttpClient
from settings import settings


class SpotifyAccessTokenProvider(Protocol):
    """Structural interface for a Spotify access token provider."""

    async def get_token(self) -> str: ...


class SpotifyUserManager:
    def __init__(
        self,
        http_client: SpotifyHttpClient,
        redis: Redis,
        tokens: SpotifyAccessTokenProvider,
        app_client_id: str,
        users_ttl: int,
    ):
        self._http_client = http_client
        self._redis = redis
        self._tokens = tokens
        self._app_client_id = app_client_id
        self._users_ttl = users_ttl
        self._users_key = "queue:active_users"

    async def add_user(self, user: SpotifyUserCreationRequest) -> SpotifyUser:
        """Add a new user to the Spotify app."""
        try:
            return await self._activate_user(user)
        except Exception as e:
            raise SpotifyUserManagementError(f"Failed to add user {user.email}.") from e

    async def remove_user(self, user: SpotifyUser) -> None:
        """Remove a user from the Spotify app."""
        try:
            await self._deactivate_user(user)
        except Exception as e:
            raise SpotifyUserManagementError(
                f"Failed to remove user {user.email}."
            ) from e

    async def has_user(self, email: str) -> bool:
        """Check if a user with the given email is active in the Spotify app."""
        active_users = await self.get_users()
        return any(user.email == email for user in active_users)

    async def get_user(self, email: str) -> SpotifyUser | None:
        """Get the active user with the given email from the Spotify app. Returns None if the user is not active."""
        active_users = await self.get_users()
        return next((user for user in active_users if user.email == email), None)

    async def get_users(self) -> list[SpotifyUser]:
        """Get the list of active users for the Spotify app."""
        if cached := await self._redis.get(self._users_key):
            return SpotifyUsersResponse.model_validate_json(cached).users
        try:
            return await self._fetch_users()
        except Exception as e:
            raise SpotifyUserManagementError("Failed to fetch active users.") from e

    async def _fetch_users(self) -> list[SpotifyUser]:
        """Fetch the list of active users for the Spotify app, bypassing the cache."""
        async with self._http_client.get(
            self._build_url(),
            headers=await self._build_headers(),
            raise_for_status=True,
        ) as response:
            table = SpotifyUsersResponse.model_validate(await response.json())
            await self._redis.set(
                self._users_key,
                table.model_dump_json(),
                ex=self._users_ttl,
            )
            return table.users

    async def _activate_user(self, user: SpotifyUserCreationRequest) -> SpotifyUser:
        """Activate a new user in the Spotify app."""
        async with self._http_client.post(
            url=self._build_url(write=True),
            headers=await self._build_headers(),
            json=user.model_dump(),
            raise_for_status=True,
        ) as response:
            active_user = SpotifyUser.model_validate(await response.json())
            await self._redis.delete(self._users_key)
            logger.debug(f"Added user: {active_user.email}")
            return active_user

    async def _deactivate_user(self, user: SpotifyUser) -> None:
        """Deactivate a user in the Spotify app."""
        async with self._http_client.delete(
            url=f"{self._build_url(write=True)}/id/{user.id}",
            headers=await self._build_headers(),
            raise_for_status=True,
        ):
            await self._redis.delete(self._users_key)
            logger.debug(f"Deactivated user: {user.email}")

    async def _build_headers(self) -> dict[str, str]:
        """Build the headers for Spotify's user management API."""
        return {"Authorization": f"Bearer {await self._tokens.get_token()}"}

    def _build_url(self, *, write: bool = False) -> str:
        """Build the URL for Spotify's user management API."""
        return f"https://developer.spotify.com/api/{'w' if write else ''}s4d/warp/clients/{self._app_client_id}/users"


def build_spotify_user_manager(
    http: SpotifyHttpClient,
    redis: Redis,
    tokens: SpotifyAccessTokenProvider,
) -> SpotifyUserManager:
    """Build a SpotifyUserManager wired to the real app settings."""
    return SpotifyUserManager(
        http_client=http,
        redis=redis,
        tokens=tokens,
        app_client_id=settings.spotify_client_id,
        users_ttl=settings.ttl_spotify_users,
    )
