import secrets

import resend
from loguru import logger
from redis.asyncio import Redis
from settings import settings


class EmailService:
    def __init__(self, redis: Redis):
        self._redis = redis

    async def register_user(self, email: str) -> bool:
        """Register a user by sending a verification email with a one-time token."""
        normalized_email = self._normalize_email(email)

        token = await self._reserve_token(normalized_email)
        if token is None:
            logger.info(f"Skipping {normalized_email}: token already exists")
            return False

        await self._send_verification_email(normalized_email, token)
        return True

    async def _reserve_token(self, email: str) -> str | None:
        """Reserve a one-time token for the given email if one does not already exist."""
        token = secrets.token_urlsafe(32)
        already_reserved = await self._redis.set(
            self._build_email_key(email), token, ex=settings.email_ott_ex, nx=True
        )

        # a pending token already exists for this email
        if already_reserved is not True:
            return None

        await self._redis.set(
            self._build_token_key(token), email, ex=settings.email_ott_ex
        )
        return token

    async def resolve_email_from_token(self, token: str) -> str | None:
        """Resolve the email associated with a one-time token."""
        email = await self._redis.getdel(self._build_token_key(token))
        if email is None:
            return None
        if isinstance(email, bytes):
            email = email.decode("utf-8")
        await self._redis.delete(self._build_email_key(email))
        return email

    async def has_pending_token(self, email: str) -> bool:
        """Check if there is a pending one-time token for the given email."""
        normalized_email = self._normalize_email(email)
        return await self._redis.exists(self._build_email_key(normalized_email)) > 0

    async def _send_verification_email(self, email: str, token: str) -> bool:
        """Send a verification email to the user with a one-time token."""
        try:
            await resend.Emails.send_async(
                {
                    "to": email,
                    "template": {
                        "id": "email-verification",
                        "variables": {
                            "email": email,
                            "verification_url": f"https://queue-overplayed.gaelangel.com/queue/verifications/{token}",
                        },
                    },
                },
            )
            logger.info(f"Verification email sent to: {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send enrollment email to {email}: {e}")
            return False

    async def send_onboarded_email(self, email: str) -> bool:
        """Send an email to the user indicating they have been onboarded."""
        try:
            await resend.Emails.send_async(
                {
                    "to": email,
                    "template": {
                        "id": "onboarded-email",
                        "variables": {"email": email},
                    },
                }
            )
            logger.info(f"Activation email sent to: {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send onboarded email to {email}: {e}")
            return False

    def _build_token_key(self, token: str) -> str:
        return f"queue:one_time_tokens:{token}"

    def _build_email_key(self, email: str) -> str:
        return f"queue:email_tokens:{email}"

    def _normalize_email(self, email: str) -> str:
        return email.strip().lower()
