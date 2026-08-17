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

    async def onboard_user(self, email: str) -> bool:
        if not await self._validator.user_exists(email):
            logger.info(f"Skipping {email}: no matching Spotify user")
            return False

        token, was_set = await self._generate_token(email)
        if not was_set:
            logger.info(f"Skipping {email}: token already issued and unexpired")
            return False

        await self._send_verification_email(email, token)
        return True

    async def _send_verification_email(self, email: str, token: str) -> None:
        try:
            await resend.Emails.send_async(
                {
                    "from": "overplayed@mail.gaelangel.com",
                    "to": email,
                    "subject": "Verify your email",
                    "html": f"<p>Here's your token: {token}</p>",
                }
            )
            logger.info(f"Verification email sent to: {email}")
        except Exception as e:
            logger.error(f"Failed to send enrollment email to {email}: {e}")

    async def notify_activation(self, email: str) -> None:
        try:
            await resend.Emails.send_async(
                {
                    "from": "overplayed@mail.gaelangel.com",
                    "to": email,
                    "subject": "You're in!",
                    "html": "<p>You now have access to the app! Enjoy.</p>",
                }
            )
            logger.info(f"Activation email sent to: {email}")
        except Exception as e:
            logger.error(f"Failed to send onboarded email to {email}: {e}")

    async def resolve_token(self, token: str) -> str | None:
        email = await self._redis.getdel(self._build_token_key(token))
        if isinstance(email, bytes):
            email = email.decode("utf-8")
        return email

    async def _generate_token(self, email: str) -> tuple[str, bool]:
        token = secrets.token_urlsafe(32)
        was_set = await self._redis.set(
            self._build_token_key(token),
            email,
            ex=settings.email_ott_ex,
            nx=True,
        )
        return token, was_set is True

    def _build_token_key(self, token: str) -> str:
        return f"queue:ott:{token}"
