import asyncio
import heapq
from datetime import UTC, datetime, timedelta
from typing import NamedTuple

from locking import DistributedLock
from loguru import logger
from models.queue import (
    ActiveUserStatus,
    QueuedUser,
    QueuedUserStatus,
    QueueOverview,
    QueueUserStatus,
)
from models.spotify import SpotifyUser, SpotifyUserCreationRequest
from services.queue import EmailService, QueueRepository
from services.spotify import SpotifyUserManager, SpotifyUserValidator


class FillOutcome(NamedTuple):
    """Users activated from the queue and those rejected during a fill."""

    activated: list[SpotifyUser]
    rejected: list[QueuedUser]


class QueueService:
    """Service for managing queued and active users."""

    def __init__(
        self,
        user_manager: SpotifyUserManager,
        user_validator: SpotifyUserValidator,
        emailer: EmailService,
        queue: QueueRepository,
        lock: DistributedLock,
    ):
        self._user_manager = user_manager
        self._user_validator = user_validator
        self._emailer = emailer
        self._queue = queue
        self._notification_tasks: set[asyncio.Task[bool]] = set()
        self._lock = lock
        self._user_limit = 5
        self._retry_limit = 3
        self._access_duration = timedelta(hours=24)

    async def get_user_status(self, email: str) -> QueueUserStatus | None:
        """Get the status of a user."""
        if (queued_user := await self._queue.get(email)) is not None:
            return QueuedUserStatus(
                position=queued_user.position,
                user=queued_user.user,
                start_time=await self._estimate_start_time(queued_user.position),
            )

        if (active_user := await self._user_manager.get_user(email)) is not None:
            return ActiveUserStatus(
                user=active_user,
                end_time=active_user.created_at + self._access_duration,
            )

        # user is neither in the queue nor active
        return None

    async def get_queue_overview(self) -> QueueOverview:
        """Get an overview of the queue, including active users, queued users, and next available time."""
        active_users = await self._user_manager.get_users()
        queued_users = await self._queue.dump()

        next_available_time = None
        if len(active_users) >= self._user_limit:
            next_available_time = await self._estimate_start_time(len(queued_users) + 1)

        return QueueOverview(
            active_users=active_users,
            queued_users=queued_users,
            user_limit=self._user_limit,
            next_available_time=next_available_time,
        )

    async def enqueue_user(self, email: str) -> QueueUserStatus:
        """Add a new user to the queue, process it, and retrieve their status."""
        if not await self._user_validator.user_exists(email):
            raise ValueError(f"{email} does not exist.")

        async with self._lock:
            if not await self._queue.has(
                email
            ) and not await self._user_manager.has_user(email):
                await self._queue.push(email)
                await self._process_queue_locked()

        status = await self.get_user_status(email)
        if status is None:
            raise RuntimeError(f"Failed to retrieve status for {email} after enqueue.")

        return status

    async def process_queue(self) -> None:
        """
        Process the queue by removing expired users and filling available slots.
        Acquires the distributed queue lock; used by the queue worker.
        """
        async with self._lock:
            await self._process_queue_locked()

    async def _process_queue_locked(self) -> None:
        """Process the queue. Assumes the distributed queue lock is already held."""
        evicted = await self._prune_expired_users()
        activated, rejected = await self._fill_available_slots()
        retried = await self._retry_rejected(rejected)

        self._notify_activations(activated)

        logger.success(
            f"Processed queue: evicted {len(evicted)}, "
            f"admitted {len(activated)}, retrying {len(retried)}."
        )

    async def _prune_expired_users(self) -> list[SpotifyUser]:
        """Deactivate users whose access duration has expired from the Spotify app."""
        active_users = await self._user_manager.get_users()
        now = datetime.now(UTC)
        evicted: list[SpotifyUser] = []

        for user in active_users:
            if user.created_at + self._access_duration < now:
                try:
                    await self._user_manager.remove_user(user)
                    evicted.append(user)
                except Exception as e:
                    logger.warning(f"Failed to remove user {user.email}, skipping: {e}")

        logger.info(
            f"Removed {len(evicted)} expired users: {[user.email for user in evicted]}."
        )
        return evicted

    async def _fill_available_slots(self) -> FillOutcome:
        """Fill available slots in Spotify's table with users from the queue."""
        active_users = await self._user_manager.get_users()
        available_slots = max(0, self._user_limit - len(active_users))
        if available_slots <= 0:
            logger.debug("No available slots to fill.")
            return FillOutcome(activated=[], rejected=[])

        activated: list[SpotifyUser] = []
        rejected: list[QueuedUser] = []
        for user in await self._queue.pop(count=available_slots):
            try:
                new_user = SpotifyUserCreationRequest(name=user.email, email=user.email)
                activated.append(await self._user_manager.add_user(new_user))
                logger.info(f"Activated user: {user.email}.")
            except Exception as e:
                rejected.append(user)
                logger.warning(f"Failed to activate user {user.email}, skipping: {e}")

        logger.info(
            f"Filled {len(activated)} slots with users: {[user.email for user in activated]}."
        )
        return FillOutcome(activated=activated, rejected=rejected)

    async def _retry_rejected(self, rejected: list[QueuedUser]) -> list[QueuedUser]:
        """Requeue rejected users that have not yet reached the retry limit."""
        retried: list[QueuedUser] = []
        for user in reversed(rejected):
            if user.retries >= self._retry_limit:
                logger.warning(
                    f"User {user.email} has reached the retry limit and will not be retried."
                )
                continue
            user.retries += 1
            await self._queue.retry(user)
            retried.append(user)
        return retried

    async def _estimate_start_time(self, queue_position: int) -> datetime:
        """Estimate the start time for a user based on their position in the queue."""
        active_users = await self._user_manager.get_users()
        now = datetime.now(UTC)

        heap = [u.created_at + self._access_duration for u in active_users]
        heap += [now] * max(0, self._user_limit - len(active_users))
        heapq.heapify(heap)

        start = now
        for _ in range(queue_position):
            start = max(heapq.heappop(heap), now)  # can't start in the past
            heapq.heappush(heap, start + self._access_duration)  # have access for 24h
        return start

    def _notify_activations(self, activated: list[SpotifyUser]) -> None:
        """Fires activation emails in the background."""
        for user in activated:
            task = asyncio.create_task(self._emailer.send_onboarded_email(user.email))
            self._notification_tasks.add(task)
            task.add_done_callback(self._notification_tasks.discard)
