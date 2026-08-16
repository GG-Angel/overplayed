import secrets

import resend
from redis.asyncio import Redis
from services.spotify import SpotifyUserValidator
from settings import settings

EMAIL_TOKENS_KEY = "queue:email_tokens"


class QueueEmailer:
    def __init__(self, redis: Redis, user_validator: SpotifyUserValidator):
        self._redis = redis
        self._user_validator = user_validator

    async def process_user(self, email: str) -> bool:
        if not await self._user_validator.user_exists(email):
            return False

        token, was_set = await self._generate_token(email)
        if not was_set:
            return False

        await self._send_email(email, token)
        return True

    async def _generate_token(self, email: str) -> tuple[str, bool]:
        key = f"queue:ott:{email}"
        token = secrets.token_urlsafe(32)

        was_set = await self._redis.set(key, token, ex=settings.email_ott_ex, nx=True)
        return token, was_set is True

    async def _send_email(self, recipient: str, token: str) -> None:
        await resend.Emails.send_async(
            {
                "from": "onboarding@gaelangel.com",
                "to": recipient,
                "subject": "Hello World",
                "html": f"<p>Congrats on sending your <strong>first email</strong>! Here's your token: {token}</p>",
            }
        )
