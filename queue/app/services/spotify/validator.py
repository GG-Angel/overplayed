from core.errors import SpotifyValidationError
from services.spotify.http import SpotifyHttpClient


class SpotifyUserValidator:
    """A class to validate if a Spotify user exists by checking their email address."""

    def __init__(self, http_client: SpotifyHttpClient, signup_form_key: str):
        self._http = http_client
        self._signup_form_key = signup_form_key

    @staticmethod
    async def get_signup_form_key(http: SpotifyHttpClient) -> str:
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
        async with self._http.post(
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


async def build_spotify_user_validator(
    http_client: SpotifyHttpClient,
) -> SpotifyUserValidator:
    """Build a SpotifyUserValidator with a current signup form key."""
    signup_form_key = await SpotifyUserValidator.get_signup_form_key(http_client)
    return SpotifyUserValidator(
        http_client=http_client,
        signup_form_key=signup_form_key,
    )
