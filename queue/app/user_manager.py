import json
from redis.asyncio import Redis
from loguru import logger
from datetime import datetime
from pydantic import BaseModel
from aiohttp import ClientSession


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
        if cached := await self.redis.get(self.cache_key):
            return GetUsersResponse.model_validate_json(cached).users

        async with self.session.get(
            f"/api/s4d/warp/clients/{self.client_id}/users"
        ) as response:
            result = await response.json()
            await self.redis.set(self.cache_key, json.dumps(result), ex=300)
            return GetUsersResponse.model_validate(result).users

    async def add_user(self, new_user: NewUser) -> User:
        async with self.session.post(
            f"/api/ws4d/warp/clients/{self.client_id}/users",
            json=new_user.model_dump(),
        ) as response:
            user = User.model_validate(await response.json())
            await self.redis.delete(self.cache_key)
            logger.info(f"Added user: {user.name}")
            return user

    async def remove_user(self, user: User):
        await self.session.delete(
            f"/api/ws4d/warp/clients/{self.client_id}/users/id/{user.id}"
        )
        await self.redis.delete(self.cache_key)
        logger.info(f"Removed user: {user.name}")
