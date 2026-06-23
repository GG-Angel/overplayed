from typing import Protocol
import asyncio
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from os import environ
from fakeredis.aioredis import FakeRedis
from loguru import logger
from datetime import datetime
from pydantic import BaseModel
from aiohttp import ClientSession
from cache import Cache, RedisCache
from .token import TokenRepository


USER_LIMIT = 5
USERS_KEY = "queue:users"


class NewUser(BaseModel):
    name: str
    email: str


class User(BaseModel):
    id: str
    name: str
    email: str
    clientId: str
    createdAt: datetime
    needsAnonymization: bool


class UserTable(BaseModel):
    users: list[User]


class TokenProvider(Protocol):
    async def get_access_token(self) -> str: ...


class UserRepository:
    def __init__(
        self,
        session: ClientSession,
        cache: Cache,
        auth: TokenProvider,
        client_id: str,
    ):
        self.session = session
        self.cache = cache
        self.auth = auth
        self.client_id = client_id

    def _build_url(self, *, write: bool = False) -> str:
        return f"https://developer.spotify.com/api/{'w' if write else ''}s4d/warp/clients/{self.client_id}/users"

    async def _build_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {await self.auth.get_access_token()}"}

    async def get_users(self) -> list[User]:
        if cached := await self.cache.get(USERS_KEY):
            return UserTable.model_validate_json(cached).users

        async with self.session.get(
            url=self._build_url(),
            headers=await self._build_headers(),
            raise_for_status=True,
        ) as response:
            table = UserTable.model_validate(await response.json())
            await self.cache.set(USERS_KEY, table.model_dump_json(), ttl=300)
            return table.users

    async def is_user_active(self, email: str) -> bool:
        current_users = await self.get_users()
        return email in set([u.email for u in current_users])

    async def add_user(self, new_user: NewUser) -> User:
        current_users = await self.get_users()
        if len(current_users) >= USER_LIMIT:
            raise RuntimeError(f"Cannot add user {new_user.name} - the table is full.")

        async with self.session.post(
            url=self._build_url(write=True),
            headers=await self._build_headers(),
            json=new_user.model_dump(),
            raise_for_status=True,
        ) as response:
            added_user = User.model_validate(await response.json())
            await self.cache.delete(USERS_KEY)
            logger.info(f"Added user: {added_user.name}")
            return added_user

    async def remove_user(self, user: User) -> None:
        await self.session.delete(
            url=f"{self._build_url(write=True)}/id/{user.id}",
            headers=await self._build_headers(),
            raise_for_status=True,
        )
        await self.cache.delete(USERS_KEY)
        logger.info(f"Removed user: {user.name}")


async def main():
    load_dotenv()
    redis = RedisCache(FakeRedis())
    fernet = Fernet(environ["REDIS_KEY"])

    async with ClientSession() as session:
        auth = TokenRepository(
            session, redis, fernet, environ["SPOTIFY_AUTH_CLIENT_ID"]
        )
        manager = UserRepository(session, redis, auth, environ["SPOTIFY_APP_CLIENT_ID"])
        await auth.seed_refresh_token(environ["SPOTIFY_REFRESH_TOKEN"])
        users = await manager.get_users()
        print(f"Current users: {users}")


if __name__ == "__main__":
    asyncio.run(main())
