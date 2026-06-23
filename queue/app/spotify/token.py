from cryptography.fernet import Fernet
import asyncio
from loguru import logger
from fakeredis.aioredis import FakeRedis
from pydantic import BaseModel
from redis.asyncio import Redis
from dotenv import load_dotenv
from os import environ
from aiohttp import ClientSession

TOKEN_URL = "https://accounts.spotify.com/api/token"
ACCESS_KEY = "queue:access_token"
REFRESH_KEY = "queue:refresh_token"


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    scope: str
    id_token: str


class TokenManager:
    def __init__(
        self,
        session: ClientSession,
        redis: Redis,
        fernet: Fernet,
        auth_client_id: str,
    ):
        self.session = session
        self.redis = redis
        self.fernet = fernet
        self.auth_client_id = auth_client_id

    async def get_access_token(self) -> str:
        cached = await self._get_decrypted(ACCESS_KEY)
        if cached is not None:
            return cached
        return await self._renew_access_token()  # miss -> refresh needed

    async def _renew_access_token(self) -> str:
        refresh_token = await self._get_decrypted(REFRESH_KEY)
        if refresh_token is None:
            raise RuntimeError("No refresh token stored; seed one first.")
        async with self.session.post(
            TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self.auth_client_id,
            },
        ) as response:
            response.raise_for_status()
            token = Token.model_validate(await response.json())
            await self._store_token(token)
            logger.success("Renewed token.")
            return token.access_token

    async def _store_token(self, token: Token) -> None:
        ttl = max(1, token.expires_in - 60)  # expire early
        await self.redis.set(ACCESS_KEY, self._encrypt(token.access_token), ex=ttl)
        await self.redis.set(REFRESH_KEY, self._encrypt(token.refresh_token))
        logger.info(f"Stored access (ttl={ttl}s) and rotated refresh token.")

    def _encrypt(self, value: str) -> bytes:
        return self.fernet.encrypt(value.encode())

    def _decrypt(self, value: str | bytes) -> str:
        return self.fernet.decrypt(value).decode()

    async def _get_decrypted(self, key: str) -> str | None:
        stored = await self.redis.get(key)
        return self._decrypt(stored) if stored is not None else None


async def seed_refresh_token(redis: Redis, fernet: Fernet, refresh_token: str) -> None:
    was_set = await redis.set(
        REFRESH_KEY, fernet.encrypt(refresh_token.encode()), nx=True
    )
    logger.info(
        "Seeded refresh token."
        if was_set
        else "Refresh token already exists - no action taken."
    )


async def main():
    load_dotenv()
    redis = FakeRedis()
    fernet = Fernet(environ["REDIS_KEY"])
    # 1. seed refresh token on startup
    await seed_refresh_token(redis, fernet, environ["SPOTIFY_REFRESH_TOKEN"])
    # 2. serve access tokens with manager
    async with ClientSession() as session:
        manager = TokenManager(
            session, redis, fernet, environ["SPOTIFY_AUTH_CLIENT_ID"]
        )
        token = await manager.get_access_token()
        print(f"Access Token: {token[:10]}...")


if __name__ == "__main__":
    asyncio.run(main())
