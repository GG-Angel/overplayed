import secrets

import resend
from loguru import logger
from redis.asyncio import Redis
from services.spotify import SpotifyUserValidator
from settings import settings

EMAIL_TOKENS_KEY = "queue:email_tokens"


class QueueEmailer:
    def __init__(self, redis: Redis, validator: SpotifyUserValidator):
        self._redis = redis
        self._validator = validator

    async def process_user(self, email: str) -> bool:
        if not await self._validator.user_exists(email):
            logger.info(f"Skipping {email}: no matching Spotify user")
            return False

        token, was_set = await self._generate_token(email)
        if not was_set:
            logger.info(f"Skipping {email}: token already issued and unexpired")
            return False

        await self._send_email(email, token)
        logger.info(f"Enrollment email sent to {email}")
        return True

    async def _generate_token(self, email: str) -> tuple[str, bool]:
        key = f"queue:ott:{email}"
        token = secrets.token_urlsafe(32)

        was_set = await self._redis.set(key, token, ex=settings.email_ott_ex, nx=True)
        return token, was_set is True

    async def _send_email(self, recipient: str, token: str) -> None:
        try:
            await resend.Emails.send_async(
                {
                    "from": "overplayed@mail.gaelangel.com",
                    "to": recipient,
                    "subject": "Hello World",
                    "html": f"<p>Congrats on sending your <strong>first email</strong>! Here's your token: {token}</p>",
                }
            )
        except Exception:
            logger.exception(f"Failed to send enrollment email to {recipient}")
            raise
