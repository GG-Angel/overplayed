from aiohttp import ClientSession
from loguru import logger

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


class TurnstileVerifier:
    """Verifies Cloudflare Turnstile tokens via the canonical siteverify endpoint."""

    def __init__(self, http: ClientSession, secret: str):
        self._http = http
        self._secret = secret

    async def verify(self, token: str, remote_ip: str | None = None) -> bool:
        """Return True only when Cloudflare reports success for the token."""
        payload = {"secret": self._secret, "response": token}
        if remote_ip:
            payload["remoteip"] = remote_ip

        try:
            async with self._http.post(SITEVERIFY_URL, data=payload) as response:
                result = await response.json()
        except Exception:
            logger.exception("Turnstile siteverify request failed")
            return False

        if result.get("success") is not True:
            logger.warning(f"Turnstile verification failed: {result.get('error-codes')}")
            return False

        return True
