import asyncio
import heapq
from typing import Literal
from pydantic import BaseModel
from datetime import timedelta, datetime, timezone
from loguru import logger
from redis.asyncio import Redis
from models import NewUser, ActiveUser, QueuedUser
from services.spotify import SpotifyUserManager, SpotifyUserValidator
from locking import DistributedLock
from errors import SpotifyValidationError


class QueueRepository:
    """Repository for managing the queue of users in Redis."""

    class QueuePushResult(BaseModel):
        """Result of pushing a user to the queue."""

        position: int

    class QueueDumpResult(BaseModel):
        """Result of dumping users from the queue."""

        users: list[QueuedUser]

    class QueuePopResult(BaseModel):
        """Result of popping users from the queue."""

        users: list[QueuedUser]

    class QueueGetResult(BaseModel):
        """Result of getting a user from the queue."""

        user: QueuedUser
        position: int

    def __init__(self, redis: Redis):
        self._redis = redis
        self._queue_key = "queue:queued_users"

    async def push(self, user: NewUser) -> QueuePushResult:
        """Push a new user to the queue."""
        entry = QueuedUser(
            name=user.name,
            email=user.email,
            retries=0,
            created_at=datetime.now(timezone.utc),
        )
        position = await self._redis.rpush(self._queue_key, entry.model_dump_json())
        logger.debug(f"Queued user: {user.name} (position: {position})")
        return self.QueuePushResult(position=position)

    async def retry(self, user: QueuedUser) -> QueuePushResult:
        """Push a user to the front of the queue."""
        position = await self._redis.lpush(self._queue_key, user.model_dump_json())
        logger.debug(f"Retried user: {user.name} (retries: {user.retries})")
        return self.QueuePushResult(position=position)

    async def pop(self, count: int = 1) -> QueuePopResult:
        """Pop users from the queue."""
        data = await self._redis.lpop(self._queue_key, count=count)
        if not isinstance(data, list):
            logger.debug("Queue is empty. No users dequeued.")
            return self.QueuePopResult(users=[])

        users = [QueuedUser.model_validate_json(user) for user in data]
        logger.debug(f"Dequeued {len(users)} users: {[u.name for u in users]}")
        return self.QueuePopResult(users=users)

    async def dump(self) -> QueueDumpResult:
        """Dump all users in the queue."""
        all_users = await self._redis.lrange(self._queue_key, 0, -1)
        return self.QueueDumpResult(
            users=[QueuedUser.model_validate_json(user) for user in all_users]
        )

    async def get(self, email: str) -> QueueGetResult | None:
        """Get a user by email."""
        for i, user in enumerate((await self.dump()).users):
            if user.email == email:
                return self.QueueGetResult(user=user, position=i + 1)
        return None

    async def has(self, email: str) -> bool:
        """Check if a user is in the queue by email."""
        return any(user.email == email for user in (await self.dump()).users)

    async def size(self) -> int:
        """Get the size of the queue."""
        return await self._redis.llen(self._queue_key)


class QueueService:
    """Service for managing queued and active users."""

    class InQueueStatus(BaseModel):
        status: Literal["in_queue"] = "in_queue"
        position: int
        user: QueuedUser
        start_time: datetime

    class ActiveStatus(BaseModel):
        status: Literal["active"] = "active"
        user: ActiveUser
        end_time: datetime

    class NotInQueueStatus(BaseModel):
        status: Literal["not_in_queue"] = "not_in_queue"

    UserStatusResult = InQueueStatus | ActiveStatus | NotInQueueStatus

    class QueueOverviewResult(BaseModel):
        """Overview of the queue, including active users, queued users, and next available time."""

        active_users: list[ActiveUser]
        queued_users: list[QueuedUser]
        user_limit: int
        next_available_time: datetime | None

    class PruneResult(BaseModel):
        """Result of pruning active users."""

        evicted_users: list[ActiveUser] = []

    class FillResult(BaseModel):
        """Result of filling available slots with queued users."""

        activated_users: list[ActiveUser] = []
        rejected_users: list[QueuedUser] = []

    def __init__(
        self,
        user_manager: SpotifyUserManager,
        user_validator: SpotifyUserValidator,
        queue: QueueRepository,
        lock: DistributedLock,
    ):
        self._user_manager = user_manager
        self._user_validator = user_validator
        self._queue = queue
        self._lock = lock
        self._user_limit = 5
        self._retry_limit = 3
        self._access_duration = timedelta(hours=24)

    async def get_user_status(self, email: str) -> UserStatusResult:
        """Get the status of a user."""
        queue_entry = await self._queue.get(email)
        if queue_entry is not None:
            return self.InQueueStatus(
                position=queue_entry.position,
                user=queue_entry.user,
                start_time=await self._estimate_start_time(queue_entry.position),
            )

        active_user = await self._user_manager.get_user(email)
        if active_user is not None:
            return self.ActiveStatus(
                user=active_user,
                end_time=active_user.created_at + self._access_duration,
            )

        return self.NotInQueueStatus()

    async def get_queue_overview(self) -> QueueOverviewResult:
        """Get an overview of the queue, including active users, queued users, and next available time."""
        active_users = await self._user_manager.get_users()
        queued_users = (await self._queue.dump()).users

        next_available_time = None
        if len(active_users) >= self._user_limit:
            next_available_time = await self._estimate_start_time(len(queued_users) + 1)

        return self.QueueOverviewResult(
            active_users=active_users,
            queued_users=queued_users,
            user_limit=self._user_limit,
            next_available_time=next_available_time,
        )

    async def _estimate_start_time(self, queue_position: int) -> datetime:
        """Estimate the start time for a user based on their position in the queue."""
        active_users = await self._user_manager.get_users()
        now = datetime.now(timezone.utc)

        heap = [u.created_at + self._access_duration for u in active_users]
        heap += [now] * max(0, self._user_limit - len(active_users))
        heapq.heapify(heap)

        start = now
        for _ in range(queue_position):
            start = max(heapq.heappop(heap), now)  # can't start in the past
            heapq.heappush(heap, start + self._access_duration)  # have access for 24h
        return start

    async def enqueue_user(self, user: NewUser) -> UserStatusResult:
        """Enqueue a new user to the queue."""
        async with self._lock:
            if not await self._user_validator.user_exists(user.email):
                raise SpotifyValidationError(f"{user.name} does not exist.")

            # return status if already in queue or active for idempotency
            if not await self._queue.has(user.email) and not await self._user_manager.has_user(user.email):  # fmt: skip
                await self._queue.push(user)
                await self._process_queue_locked()

        return await self.get_user_status(user.email)

    async def process_queue(self) -> None:
        """
        Process the queue by removing expired users and filling available slots.
        Acquires the distributed queue lock; used by the queue worker.
        """
        async with self._lock:
            await self._process_queue_locked()

    async def _process_queue_locked(self) -> None:
        """Process the queue. Assumes the distributed queue lock is already held."""
        prune_result = await self._prune_expired_users()
        fill_result = await self._fill_available_slots()

        retried_users: list[QueuedUser] = []
        for user in reversed(fill_result.rejected_users):
            if user.retries < self._retry_limit:
                user.retries += 1
                await self._queue.retry(user)
                retried_users.append(user)
            else:
                logger.warning(
                    f"User {user.name} has reached the retry limit and will not be retried."
                )

        logger.success(
            f"Processed queue: evicted {len(prune_result.evicted_users)}, admitted: {len(fill_result.activated_users)}, retrying: {len(retried_users)}."
        )

    async def _prune_expired_users(self) -> PruneResult:
        """Deactivate users whose access duration has expired from the Spotify app."""
        active_users = await self._user_manager.get_users()
        now = datetime.now(timezone.utc)
        result = self.PruneResult()

        for user in active_users:
            if user.created_at + self._access_duration < now:
                try:
                    await self._user_manager.remove_user(user)
                    result.evicted_users.append(user)
                except Exception as e:
                    logger.warning(f"Failed to remove user {user.name}, skipping: {e}")

        logger.info(
            f"Removed {len(result.evicted_users)} expired users: {[user.name for user in result.evicted_users]}."
        )
        return result

    async def _fill_available_slots(self) -> FillResult:
        """Fill available slots in Spotify's table with users from the queue."""
        active_users = await self._user_manager.get_users()
        available_slots = max(0, self._user_limit - len(active_users))
        result = self.FillResult()

        if available_slots <= 0:
            logger.debug("No available slots to fill.")
            return result

        dequeued_result = await self._queue.pop(count=available_slots)
        for user in dequeued_result.users:
            try:
                new_user = NewUser(name=user.name, email=user.email)
                active_user = await self._user_manager.add_user(new_user)
                result.activated_users.append(active_user)
                logger.info(f"Activated user: {user.name}.")
            except Exception as e:
                result.rejected_users.append(user)
                logger.warning(f"Failed to activate user {user.name}, skipping: {e}")

        logger.info(
            f"Filled {len(result.activated_users)} slots with users: {[user.name for user in result.activated_users]}."
        )
        return result


class QueueWorker:
    def __init__(self, queue_service: QueueService):
        self._queue_service = queue_service
        self._task: asyncio.Task | None = None
        self._poll_interval = 300  # 5 minutes

    async def _run(self) -> None:
        logger.info("Started queue worker.")
        while True:
            logger.info("Processing queue...")
            try:
                await self._queue_service.process_queue()
            except Exception as e:
                logger.exception(f"Queue processing cycle failed: {e}.")
            logger.info(f"Processing complete. Sleeping for {self._poll_interval}s...")
            await asyncio.sleep(self._poll_interval)

    def start(self) -> None:
        if self._task is not None:
            logger.warning("Worker already started.")
            return
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task is None:
            logger.warning("Worker not started.")
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        logger.info("Stopped queue worker.")
