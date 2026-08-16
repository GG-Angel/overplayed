from settings import settings
from redis.asyncio import Redis
from services.spotify import SpotifyUserValidator
import secrets

EMAIL_TOKENS_KEY = "queue:email_tokens"


class QueueEmailer:
    def __init__(self, redis: Redis, user_validator: SpotifyUserValidator):
        self._redis = redis
        self._user_validator = user_validator

    async def process_user(self, email: str) -> bool:
        if not await self._user_validator.user_exists(email):
            return False

        ott, was_set = await self._generate_token(email)
        if not was_set:
            return False

        return True

    async def _generate_token(self, email: str) -> tuple[str, bool]:
        key = f"queue:ott:{email}"
        token = secrets.token_urlsafe(32)

        was_set = await self._redis.set(key, token, ex=settings.email_ott_ex, nx=True)
        return token, was_set is True

    async def _send_email(self, email: str, token: str) -> None:
        r = resend.Emails.send(
            {
                "from": "onboarding@resend.dev",
                "to": "gaelangel.gga@gmail.com",
                "subject": "Hello World",
                "html": "<p>Congrats on sending your <strong>first email</strong>!</p>",
            }
        )
