from loguru import logger
from cryptography.fernet import Fernet
from redis.asyncio import Redis
from pydantic import BaseModel
from aiohttp import ClientSession
from errors import SpotifyValidationError, SpotifyTokenError, SpotifyUserManagementError
from models import ActiveUser, NewUser


class SpotifyUserValidator:
    """A class to validate if a Spotify user exists by checking their email address."""

    def __init__(self, http: ClientSession, signup_form_key: str):
        self._http = http
        self._signup_form_key = signup_form_key

    @classmethod
    async def create(cls, http: ClientSession) -> "SpotifyUserValidator":
        """Create an instance of SpotifyUserValidator with a valid signup form key."""
        signup_form_key = await cls.get_signup_form_key(http)
        return cls(http, signup_form_key)

    @staticmethod
    async def get_signup_form_key(http: ClientSession) -> str:
        """Fetch the signup form key from Spotify's signup page."""
        async with http.get("https://www.spotify.com/us/signup") as response:
            text = await response.text()
            marker = '"signupServiceAppKey":"'
            start = text.find(marker)
            if start == -1:
                raise SpotifyValidationError("Signup key not found in source.")
            start += len(marker)
            end = text.find('"', start)
            if end == -1:
                raise SpotifyValidationError("Signup key not terminated in source.")
            return text[start:end]

    async def user_exists(self, email: str, *, _retried: bool = False) -> bool:
        """Check if a Spotify user exists by validating the email address."""
        async with self._http.get(
            "https://spclient.wg.spotify.com/signup/public/v2/account/validate",
            json={
                "fields": [{"field": "FIELD_EMAIL", "value": email}],
                "client_info": {"api_key": self._signup_form_key},
            },
        ) as response:
            data = await response.json()
            if "error" not in data:
                return False  # no error means the user does not exist

            error = data["error"]
            if "already_exists" in error:
                return True  # user exists

            if "field_errors" in error.get("invalid_argument", {}):
                return False  # invalid email

            if _retried:
                raise SpotifyValidationError("Signup form key invalid after refresh.")

            # if we haven't retried yet, refresh the signup form key and try again
            self._signup_form_key = await self.get_signup_form_key(self._http)
            return await self.user_exists(email, _retried=True)


class SpotifyTokenProvider:
    """A class to provide access tokens for Spotify's user management API."""

    class Token(BaseModel):
        access_token: str
        refresh_token: str
        expires_in: int

    def __init__(
        self,
        http: ClientSession,
        redis: Redis,
        crypto: Fernet,
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

    async def _renew_token(self, refresh_token: str) -> Token:
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
            return self.Token.model_validate(await response.json())

    async def _persist_token(self, token: Token) -> None:
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


class SpotifyUserManager:
    class GetUsersResponse(BaseModel):
        users: list[ActiveUser]

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
            raise SpotifyUserManagementError(f"Failed to add user {user.name}.") from e

    async def remove_user(self, user: ActiveUser) -> None:
        """Remove a user from the Spotify app."""
        try:
            await self.deactivate_user(user)
        except Exception as e:
            raise SpotifyUserManagementError(
                f"Failed to remove user {user.name}."
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
            return self.GetUsersResponse.model_validate_json(cached).users
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
            table = self.GetUsersResponse.model_validate(await response.json())
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
            logger.debug(f"Added user: {active_user.name}")
            return active_user

    async def deactivate_user(self, user: ActiveUser) -> None:
        """Deactivate a user in the Spotify app."""
        async with self._http.delete(
            url=f"{self._build_url(write=True)}/id/{user.id}",
            headers=await self._build_headers(),
            raise_for_status=True,
        ):
            await self._redis.delete(self._users_key)
            logger.debug(f"Deactivated user: {user.name}")

    async def _build_headers(self) -> dict[str, str]:
        """Build the headers for Spotify's user management API."""
        return {"Authorization": f"Bearer {await self._tokens.get_token()}"}

    def _build_url(self, *, write: bool = False) -> str:
        """Build the URL for Spotify's user management API."""
        return f"https://developer.spotify.com/api/{'w' if write else ''}s4d/warp/clients/{self._app_client_id}/users"
