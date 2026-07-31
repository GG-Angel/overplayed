from types import TracebackType
from typing import Self

from errors import QueueLockError
from loguru import logger
from redis.asyncio import Redis
from redis.exceptions import LockError


class DistributedLock:
    """A Redis-backed distributed lock guarding a named critical section."""

    def __init__(
        self,
        redis: Redis,
        name: str,
        *,
        timeout: float = 45,
        blocking_timeout: float | None = 10,
    ):
        self._name = name
        self._lock = redis.lock(
            name,
            timeout=timeout,
            blocking_timeout=blocking_timeout,
        )

    async def __aenter__(self) -> Self:
        acquired = await self._lock.acquire()
        if not acquired:
            raise QueueLockError(
                f"Could not acquire lock '{self._name}' in time; try again."
            )
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            await self._lock.release()
        except LockError:
            logger.warning(f"Lock '{self._name}' was already released or expired.")
