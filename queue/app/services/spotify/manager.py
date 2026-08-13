from aiohttp import ClientSession
from errors import SpotifyUserManagementError
from loguru import logger
from models import ActiveUser, NewUser
from pydantic import BaseModel
from redis.asyncio import Redis
from services.spotify.tokens import SpotifyTokenProvider


class UsersResponse(BaseModel):
    users: list[ActiveUser]


class SpotifyUserManager:
    def __init__(
        self,
        http: ClientSession,
        redis: Redis,
        tokens: SpotifyTokenProvider,
        app_client_id: str,
    ):
        self._http = http
        self._redis = redis
        self._tokens = tokens
        self._app_client_id = app_client_id
        self._users_key = "queue:active_users"

    async def add_user(self, user: NewUser) -> ActiveUser:
        """Add a new user to the Spotify app."""
        try:
            return await self._activate_user(user)
        except Exception as e:
            raise SpotifyUserManagementError(f"Failed to add user {user.email}.") from e

    async def remove_user(self, user: ActiveUser) -> None:
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

    async def get_user(self, email: str) -> ActiveUser | None:
        """Get the active user with the given email from the Spotify app. Returns None if the user is not active."""
        active_users = await self.get_users()
        return next((user for user in active_users if user.email == email), None)

    async def get_users(self) -> list[ActiveUser]:
        """Get the list of active users for the Spotify app."""
        if cached := await self._redis.get(self._users_key):
            return UsersResponse.model_validate_json(cached).users
        try:
            return await self._fetch_users()
        except Exception as e:
            raise SpotifyUserManagementError("Failed to fetch active users.") from e

    async def _fetch_users(self) -> list[ActiveUser]:
        """Fetch the list of active users for the Spotify app, bypassing the cache."""
        async with self._http.get(
            self._build_url(),
            headers=await self._build_headers(),
            raise_for_status=True,
        ) as response:
            table = UsersResponse.model_validate(await response.json())
            await self._redis.set(self._users_key, table.model_dump_json(), ex=300)
            return table.users

    async def _activate_user(self, user: NewUser) -> ActiveUser:
        """Activate a new user in the Spotify app."""
        async with self._http.post(
            url=self._build_url(write=True),
            headers=await self._build_headers(),
            json=user.model_dump(),
            raise_for_status=True,
        ) as response:
            active_user = ActiveUser.model_validate(await response.json())
            await self._redis.delete(self._users_key)
            logger.debug(f"Added user: {active_user.email}")
            return active_user

    async def _deactivate_user(self, user: ActiveUser) -> None:
        """Deactivate a user in the Spotify app."""
        async with self._http.delete(
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
