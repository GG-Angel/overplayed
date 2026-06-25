import heapq
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


class UserNotAdded(Exception):
    pass


class UserStatusResult(BaseModel):
    position: int | None
    admitted: bool
    start_time: datetime
    end_time: datetime


class ViewQueueResult(BaseModel):
    active_users: int
    queued_users: int
    user_limit: int
    next_available_time: datetime | None


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

    def _get_start_time(
        self,
        active_users: list[User],
        position: int,
        now: datetime,
    ) -> datetime:
        heap = [u.createdAt + ACCESS_DURATION for u in active_users]
        heap += [now] * max(0, USER_LIMIT - len(active_users))
        heapq.heapify(heap)

        start = now
        for _ in range(position):
            start = max(heapq.heappop(heap), now)  # can't start in the past
            heapq.heappush(heap, start + ACCESS_DURATION)  # they hold it 24h
        return start

    async def enqueue(self, user: NewUser) -> UserStatusResult:
        if await self._queue.has_user(user.email):
            raise UserAlreadyInQueue()
        if await self._users.is_user_active(user.email):
            raise UserAlreadyActive()
        if not await self._validator.does_user_exist(user.email):
            raise UserDoesNotExist()

        await self._queue.enqueue(user)
        await self._fill_available_slots()
        return await self.get_user_status(user)

    async def get_user_status(self, user: NewUser) -> UserStatusResult:
        active = await self.list_active_users()
        active_user = next((u for u in active if u == user), None)
        if active_user:
            return UserStatusResult(
                position=None,
                admitted=True,
                start_time=active_user.createdAt,
                end_time=active_user.createdAt + ACCESS_DURATION,
            )

        queued = await self.list_queued_users()
        position = next(
            (i + 1 for i, queued_user in enumerate(queued) if queued_user == user),
            None,
        )
        if position is None:
            raise UserNotAdded()
        start_time = self._get_start_time(active, position, datetime.now(timezone.utc))
        return UserStatusResult(
            position=position,
            admitted=False,
            start_time=start_time,
            end_time=start_time + ACCESS_DURATION,
        )

    async def get_queue_status(self) -> ViewQueueResult:
        active = await self.list_active_users()
        queued = await self._queue.get_size()
        next_available = (
            self._get_start_time(active, queued + 1, datetime.now(timezone.utc))
            if len(active) + queued >= USER_LIMIT
            else None
        )

        return ViewQueueResult(
            active_users=len(active),
            queued_users=queued,
            user_limit=USER_LIMIT,
            next_available_time=next_available,
        )

    async def process(self) -> None:
        removed = await self._evict_expired_users()
        added = await self._fill_available_slots()
        logger.success(f"Evicted {len(removed)} and admitted {len(added)} new users.")
