import asyncio
from cryptography.fernet import Fernet
from loguru import logger
from fakeredis.aioredis import FakeRedis
from pydantic import BaseModel
from dotenv import load_dotenv
from os import environ
from aiohttp import ClientSession, ClientResponseError
from cache import Cache, RedisCache

TOKEN_URL = "https://accounts.spotify.com/api/token"
ACCESS_KEY = "queue:access_token"
REFRESH_KEY = "queue:refresh_token"


class MissingRefreshTokenError(Exception):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    scope: str
    id_token: str


class SpotifyTokenClient:
    def __init__(
        self,
        session: ClientSession,
        cache: Cache,
        fernet: Fernet,
        auth_client_id: str,
    ):
        self.session = session
        self.cache = cache
        self.fernet = fernet
        self.auth_client_id = auth_client_id

    async def seed_refresh_token(self, refresh_token: str) -> None:
        if await self.cache.exists(REFRESH_KEY):
            logger.info("Refresh token already exists - no action taken.")
            return
        try:
            token = await self._renew_token(refresh_token)
        except ClientResponseError:
            logger.critical("Spotify refresh token or auth client id are invalid. Please renew.")  # fmt:skip
            raise
        await self._store_token(token)
        logger.success("Seeded and verified refresh token.")

    async def get_access_token(self) -> str:
        cached = await self._get_decrypted(ACCESS_KEY)
        if cached is not None:
            return cached

        refresh_token = await self._get_decrypted(REFRESH_KEY)
        if refresh_token is None:
            raise MissingRefreshTokenError("No refresh token stored; seed one first.")

        token = await self._renew_token(refresh_token)
        await self._store_token(token)
        logger.debug("Renewed token.")
        return token.access_token

    async def _renew_token(self, refresh_token: str) -> Token:
        async with self.session.post(
            TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self.auth_client_id,
            },
        ) as response:
            response.raise_for_status()
            return Token.model_validate(await response.json())

    async def _store_token(self, token: Token) -> None:
        ttl = max(1, token.expires_in - 60)  # expire early
        await self.cache.set(ACCESS_KEY, self._encrypt(token.access_token), ttl=ttl)
        await self.cache.set(REFRESH_KEY, self._encrypt(token.refresh_token))
        logger.debug(f"Stored access (ttl={ttl}s) and rotated refresh token.")

    async def _get_decrypted(self, key: str) -> str | None:
        stored = await self.cache.get(key)
        return self._decrypt(stored) if stored is not None else None

    def _encrypt(self, value: str) -> str:
        return self.fernet.encrypt(value.encode()).decode()

    def _decrypt(self, value: str) -> str:
        return self.fernet.decrypt(value).decode()


async def main():
    load_dotenv()
    redis = RedisCache(FakeRedis())
    fernet = Fernet(environ["REDIS_KEY"])
    async with ClientSession() as session:
        manager = SpotifyTokenClient(
            session, redis, fernet, environ["SPOTIFY_AUTH_CLIENT_ID"]
        )
        await manager.seed_refresh_token(environ["SPOTIFY_REFRESH_TOKEN"])
        token = await manager.get_access_token()
        print(f"Access Token: {token[:10]}...")


if __name__ == "__main__":
    asyncio.run(main())
