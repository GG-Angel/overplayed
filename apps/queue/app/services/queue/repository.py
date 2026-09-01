from collections.abc import Callable
from datetime import UTC, datetime

from loguru import logger
from redis.asyncio import Redis

from app.models.queue import QueuedUser, QueuedUserPosition


def utc_now() -> datetime:
    return datetime.now(UTC)


class QueueRepository:
    """Repository for managing the queue of users in Redis."""

    def __init__(
        self,
        redis: Redis,
        now_factory: Callable[[], datetime] = utc_now,
    ):
        self._redis = redis
        self._queue_key = "queue:queued_users"
        self._now_factory = now_factory

    async def push(self, email: str) -> int:
        """Push a new user to the back of the queue and return their position."""
        entry = QueuedUser(
            email=email,
            retries=0,
            created_at=self._now_factory(),
        )
        position = await self._redis.rpush(self._queue_key, entry.model_dump_json())
        logger.debug(f"Queued user: {email} (position: {position})")
        return position

    async def retry(self, user: QueuedUser) -> int:
        """Push a user to the front of the queue and return the new queue length."""
        length = await self._redis.lpush(self._queue_key, user.model_dump_json())
        logger.debug(f"Retried user: {user.email} (retries: {user.retries})")
        return length

    async def pop(self, count: int = 1) -> list[QueuedUser]:
        """Pop up to `count` users from the front of the queue."""
        data = await self._redis.lpop(self._queue_key, count=count)
        if not isinstance(data, list):
            logger.debug("Queue is empty. No users dequeued.")
            return []

        users = [QueuedUser.model_validate_json(user) for user in data]
        logger.debug(f"Dequeued {len(users)} users: {[user.email for user in users]}")
        return users

    async def dump(self) -> list[QueuedUser]:
        """Return every user currently in the queue, front to back."""
        entries = await self._redis.lrange(self._queue_key, 0, -1)
        return [QueuedUser.model_validate_json(entry) for entry in entries]

    async def get(self, email: str) -> QueuedUserPosition | None:
        """Get a queued user by email, or None if they are not queued."""
        for i, user in enumerate(await self.dump()):
            if user.email == email:
                return QueuedUserPosition(user=user, position=i + 1)
        return None

    async def has(self, email: str) -> bool:
        """Check if a user is in the queue by email."""
        return any(user.email == email for user in await self.dump())

    async def size(self) -> int:
        """Get the size of the queue."""
        return await self._redis.llen(self._queue_key)


def build_queue_repository(redis: Redis) -> QueueRepository:
    """Build a QueueRepository backed by Redis."""
    return QueueRepository(redis)
