import asyncio
from loguru import logger
from fakeredis.aioredis import FakeRedis
from pydantic import BaseModel
from redis.asyncio import Redis
from dotenv import load_dotenv
from os import environ
from aiohttp import ClientSession

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
        client_id: str,
    ):
        self.session = session
        self.redis = redis
        self.client_id = client_id

    async def seed_refresh_token(self, refresh_token: str) -> None:
        was_set = await self.redis.set(REFRESH_KEY, refresh_token, nx=True)
        if was_set:
            logger.info("Seeded refresh token.")
        else:
            logger.info("Refresh token already exists - no seeding performed.")

    async def get_access_token(self) -> str:
        cached = await self._get_stored_token(ACCESS_KEY)
        if cached is not None:
            return cached
        return await self._renew_access_token()  # miss -> refresh needed

    async def _renew_access_token(self) -> str:
        refresh_token = await self._get_stored_token(REFRESH_KEY)
        if refresh_token is None:
            raise RuntimeError("No refresh token stored; seed one first.")

        async with self.session.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self.client_id,
            },
        ) as response:
            token = Token.model_validate(await response.json())
            await self._store_token(token)
            logger.success("Renewed token.")
            return token.access_token

    async def _store_token(self, token: Token) -> None:
        ttl = max(1, token.expires_in - 60)  # expire before for safety
        await self.redis.set(ACCESS_KEY, token.access_token, ex=ttl)
        await self.redis.set(REFRESH_KEY, token.refresh_token)
        logger.info(f"Stored access (ttl={ttl}s) and rotated refresh token.")

    async def _get_stored_token(self, key: str) -> str | None:
        value = await self.redis.get(key)
        if value is not None and isinstance(value, bytes):
            value = value.decode()
        return value


async def main():
    load_dotenv()

    async with ClientSession() as session:
        manager = TokenManager(
            session,
            FakeRedis(),
            # environ["REDIS_KEY"].encode(),
            environ["SPOTIFY_CLIENT_ID"],
        )

        await manager.seed_refresh_token(environ["SPOTIFY_REFRESH_TOKEN"])

        for i in range(3):
            token = await manager.get_access_token()
            print(f"Token #{i + 1}: {token[:10]}...")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
