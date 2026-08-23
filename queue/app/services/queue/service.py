import asyncio
import heapq
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import NamedTuple

from core.lock import DistributedLock
from fastapi import HTTPException
from loguru import logger
from models.queue import (
    ActiveUserStatus,
    PendingUserStatus,
    QueuedUser,
    QueuedUserStatus,
    QueueOverview,
    QueueUserStatus,
)
from models.spotify import SpotifyUser, SpotifyUserCreationRequest
from redis.asyncio import Redis
from services.queue import EmailService, QueueRepository
from services.spotify import SpotifyUserManager, SpotifyUserValidator
from settings import settings


def utc_now() -> datetime:
    return datetime.now(UTC)


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
        *,
        user_limit: int,
        retry_limit: int,
        user_ttl: int,
        now_factory: Callable[[], datetime] = utc_now,
    ):
        self._user_manager = user_manager
        self._user_validator = user_validator
        self._emailer = emailer
        self._queue = queue
        self._notification_tasks: set[asyncio.Task[bool]] = set()
        self._lock = lock
        self._user_limit = user_limit
        self._retry_limit = retry_limit
        self._access_duration = timedelta(seconds=user_ttl)
        self._now_factory = now_factory

    async def get_user_status(self, email: str) -> QueueUserStatus | None:
        """Get the status of a user."""
        if await self._emailer.has_pending_token(email):
            return PendingUserStatus()
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

    async def enqueue_user(self, email: str) -> None:
        """Add a new user to the queue and process it."""
        await self._validate_user_exists(email)
        async with self._lock:
            is_in_queue = await self._queue.has(email)
            is_active = await self._user_manager.has_user(email)
            if not is_in_queue and not is_active:
                await self._queue.push(email)
                await self._process_queue_locked()

    async def register_user(self, email: str) -> None:
        """Register a user by sending a verification email with a one-time token."""
        await self._validate_user_exists(email)
        if await self.get_user_status(email) is None:
            await self._emailer.register_user(email)

    async def _validate_user_exists(self, email: str) -> None:
        """Validate that a user exists in Spotify's system."""
        if not await self._user_validator.user_exists(email):
            raise HTTPException(status_code=400, detail=f"{email} does not exist.")

    async def verify_and_enqueue_user(self, token: str) -> str:
        """Verify a one-time token and enqueue the user if valid."""
        email = await self._emailer.resolve_email_from_token(token)
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid or expired token.")
        await self.enqueue_user(email)
        return email

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
        now = self._now_factory()
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
        now = self._now_factory()

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


def build_queue_service(
    user_manager: SpotifyUserManager,
    user_validator: SpotifyUserValidator,
    emailer: EmailService,
    queue: QueueRepository,
    redis: Redis,
) -> QueueService:
    """Build a QueueService wired to Redis and the real app settings."""
    return QueueService(
        user_manager=user_manager,
        user_validator=user_validator,
        emailer=emailer,
        queue=queue,
        lock=DistributedLock(redis, timeout=30, blocking_timeout=10),
        user_limit=settings.queue_user_limit,
        retry_limit=settings.queue_retry_limit,
        user_ttl=settings.ttl_queue_users,
    )
