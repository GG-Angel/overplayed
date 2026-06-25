from pydantic import BaseModel
from loguru import logger
from aiohttp import ClientResponseError
from datetime import datetime, timezone, timedelta
from queues.manager import QueueRepository
from spotify.users import SpotifyUserManagementClient, NewUser, User, USER_LIMIT
from spotify.validate import SpotifyUserValidator

ACCESS_DURATION = timedelta(hours=24)


class UserAlreadyInQueue(Exception):
    pass


class UserAlreadyActive(Exception):
    pass


class UserDoesNotExist(Exception):
    pass


class EnqueueResult(BaseModel):
    position: int
    admitted: bool


class QueueService:
    def __init__(
        self,
        users: SpotifyUserManagementClient,
        validator: SpotifyUserValidator,
        queue: QueueRepository,
    ):
        self._users = users
        self._validator = validator
        self._queue = queue

    async def list_active_users(self) -> list[User]:
        return await self._users.get_users()

    async def list_queued_users(self) -> list[NewUser]:
        return await self._queue.get_users()

    async def _list_expired_users(self) -> list[User]:
        now = datetime.now(timezone.utc)
        active = await self.list_active_users()
        return [user for user in active if now >= user.createdAt + ACCESS_DURATION]

    async def _evict_expired_users(self) -> list[User]:
        users_removed: list[User] = []
        for user in await self._list_expired_users():
            try:
                await self._users.remove_user(user)
                users_removed.append(user)
                logger.info(f"Evicted user: {user.name}.")
            except ClientResponseError:
                logger.warning(f"Failed to evict user {user.name}, skipping.")
        return users_removed

    async def _fill_available_slots(self) -> list[User]:
        active_users = await self.list_active_users()
        slots_available = max(0, USER_LIMIT - len(active_users))
        if slots_available == 0:
            logger.info("All slots are full. No users added.")
            return []

        new_users = await self._queue.dequeue(count=slots_available)
        if not new_users:
            logger.info("Queue is empty. No users added.")
            return []

        users_added: list[User] = []
        for user in new_users:
            try:
                users_added.append(await self._users.add_user(user))
                logger.info(f"Added user: {user.name}.")
            except ClientResponseError:
                logger.error(f"Failed to add user {user.name}, skipping.")
        return users_added

    async def enqueue(self, user: NewUser) -> EnqueueResult:
        if await self._queue.is_user_in_queue(user.email):
            raise UserAlreadyInQueue()
        if await self._users.is_user_active(user.email):
            raise UserAlreadyActive()
        if not await self._validator.does_user_exist(user.email):
            raise UserDoesNotExist()

        position = await self._queue.enqueue(user)
        added = await self._fill_available_slots()
        admitted = any(u.email == user.email for u in added)
        return EnqueueResult(position=position, admitted=admitted)

    async def process(self) -> None:
        removed = await self._evict_expired_users()
        added = await self._fill_available_slots()
        logger.success(f"Evicted {len(removed)} and admitted {len(added)} new users.")
