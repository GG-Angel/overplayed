import json
from redis.asyncio import Redis
from loguru import logger
from datetime import datetime
from pydantic import BaseModel
from aiohttp import ClientSession

USER_LIMIT = 5


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


class UserManager:
    def __init__(
        self,
        session: ClientSession,
        redis: Redis,
        client_id: str,
        user_limit: int,
        redis_key: str,
    ):
        self.session = session
        self.redis = redis
        self.client_id = client_id
        self.redis_key = redis_key
        self.user_limit = user_limit

    async def get_users(self) -> list[User]:
        if cached := await self.redis.get(self.redis_key):
            return UserTable.model_validate_json(cached).users

        async with self.session.get(self._build_url(write=False)) as response:
            result = await response.json()
            await self.redis.set(self.redis_key, json.dumps(result), ex=300)
            return UserTable.model_validate(result).users

    async def add_user(self, new_user: NewUser) -> User:
        current_users = await self.get_users()
        if len(current_users) >= self.user_limit:
            raise RuntimeError(f"Cannot add user {new_user.name} - the table is full.")

        async with self.session.post(
            self._build_url(write=True),
            json=new_user.model_dump(),
        ) as response:
            added_user = User.model_validate(await response.json())
            await self.redis.delete(self.redis_key)
            logger.info(f"Added user: {added_user.name}")
            return added_user

    async def remove_user(self, user: User) -> None:
        await self.session.delete(f"{self._build_url(write=True)}/id/{user.id}")
        await self.redis.delete(self.redis_key)
        logger.info(f"Removed user: {user.name}")

    def _build_url(self, write: bool) -> str:
        return f"/api/{'w' if write else ''}s4d/warp/clients/{self.client_id}/users"
