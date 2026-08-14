from base64 import urlsafe_b64encode
from hashlib import sha256
from hmac import digest
from re import fullmatch
from secrets import token_urlsafe
from typing import Protocol

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pydantic import BaseModel

from cache.codec import Codec

_OPAQUE_TOKEN_PATTERN = r"[A-Za-z0-9_-]{43}"
_STATE_BYTES = 32
_BINDING_BYTES = 32
_VERIFIER_BYTES = 64


class OAuthRedisClient(Protocol):
    async def set(self, key: str, value: str, ttl: int) -> None: ...

    async def getdel(self, key: str) -> str | None: ...


class PendingOAuthTransaction(BaseModel):
    redirect_to: str
    code_verifier: str


class OAuthLoginAttempt(BaseModel):
    state: str
    browser_binding: str
    code_challenge: str


class OAuthTransactionStore:
    def __init__(
        self,
        redis: OAuthRedisClient,
        redis_key: bytes,
        ttl: int,
    ):
        self._redis = redis
        self._codec = Codec(AESGCM(redis_key)).model(PendingOAuthTransaction)
        self._lookup_key = digest(
            redis_key, b"overplayed:oauth-transaction-lookup", sha256
        )
        self._ttl = ttl

    async def create(
        self, redirect_to: str, browser_binding: str | None
    ) -> OAuthLoginAttempt:
        state = token_urlsafe(_STATE_BYTES)
        # A browser may start several logins, but clearing this shared binding
        # on callback deliberately permits only the first callback to complete.
        binding = (
            browser_binding
            if browser_binding is not None
            and self._is_valid_opaque_token(browser_binding)
            else token_urlsafe(_BINDING_BYTES)
        )
        verifier = token_urlsafe(_VERIFIER_BYTES)
        challenge = urlsafe_b64encode(sha256(verifier.encode()).digest()).rstrip(b"=")

        transaction = PendingOAuthTransaction(
            redirect_to=redirect_to,
            code_verifier=verifier,
        )
        await self._redis.set(
            self._build_key(state, binding),
            self._codec.encrypt(transaction),
            self._ttl,
        )
        return OAuthLoginAttempt(
            state=state,
            browser_binding=binding,
            code_challenge=challenge.decode(),
        )

    async def consume(
        self, state: str | None, browser_binding: str | None
    ) -> PendingOAuthTransaction | None:
        if state is None or browser_binding is None:
            return None
        if not self._is_valid_opaque_token(state) or not self._is_valid_opaque_token(
            browser_binding
        ):
            return None

        encrypted = await self._redis.getdel(self._build_key(state, browser_binding))
        return self._codec.decrypt(encrypted) if encrypted else None

    def _build_key(self, state: str, browser_binding: str) -> str:
        identifier = digest(
            self._lookup_key,
            f"{state}:{browser_binding}".encode(),
            sha256,
        ).hex()
        return f"oauth:transactions:{identifier}"

    @staticmethod
    def _is_valid_opaque_token(token: str | None) -> bool:
        return token is not None and fullmatch(_OPAQUE_TOKEN_PATTERN, token) is not None
