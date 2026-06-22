import asyncio
from fastapi import status
import json
from typing import TypeVar, Callable, Awaitable
from redis.asyncio import Redis
from loguru import logger
from datetime import datetime
from pydantic import BaseModel
from aiohttp import ClientSession, ClientResponseError

USER_LIMIT = 5
MAX_RETRIES = 3
RETRY_DELAY = 2


T = TypeVar("T")


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


class GetUsersResponse(BaseModel):
    users: list[User]


class UserManager:
    def __init__(self, session: ClientSession, redis: Redis, client_id: str):
        self.session = session
        self.redis = redis
        self.client_id = client_id
        self.cache_key = "queue:users"

    async def get_users(self) -> list[User]:
        async def fetch() -> list[User]:
            async with self.session.get(
                f"/api/s4d/warp/clients/{self.client_id}/users"
            ) as response:
                result = await response.json()
                await self.redis.set(self.cache_key, json.dumps(result), ex=300)
                return GetUsersResponse.model_validate(result).users

        if cached := await self.redis.get(self.cache_key):
            return GetUsersResponse.model_validate_json(cached).users
        return await self._with_retry(fetch)

    async def add_user(self, new_user: NewUser) -> User:
        async def fetch() -> User:
            async with self.session.post(
                f"/api/ws4d/warp/clients/{self.client_id}/users",
                json=new_user.model_dump(),
            ) as response:
                user = User.model_validate(await response.json())
                await self.redis.delete(self.cache_key)
                logger.info(f"Added user: {user.name}")
                return user

        return await self._with_retry(fetch)

    async def remove_user(self, user: User) -> None:
        async def fetch() -> None:
            await self.session.delete(
                f"/api/ws4d/warp/clients/{self.client_id}/users/id/{user.id}"
            )
            await self.redis.delete(self.cache_key)
            logger.info(f"Removed user: {user.name}")

        return await self._with_retry(fetch)

    async def _with_retry(self, request: Callable[[], Awaitable[T]]) -> T:
        for attempt in range(MAX_RETRIES):
            try:
                return await request()
            except ClientResponseError as e:
                if (
                    e.status != status.HTTP_429_TOO_MANY_REQUESTS
                    or attempt >= MAX_RETRIES - 1
                    or not e.headers
                ):
                    raise
                retry_after = float(e.headers.get("Retry-After", RETRY_DELAY**attempt))
                logger.warning(f"Rate limited; retrying after {retry_after}s ({attempt+1}/{MAX_RETRIES})")  # fmt: skip
                await asyncio.sleep(retry_after)
        raise RuntimeError("Unreachable")
