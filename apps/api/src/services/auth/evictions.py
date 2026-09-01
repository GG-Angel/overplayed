import asyncio
from collections.abc import Awaitable, Callable
from typing import Protocol, cast

from loguru import logger
from pydantic import ValidationError
from redis.asyncio import Redis
from redis.exceptions import ResponseError, TimeoutError
from shared.constants import RedisKeys
from shared.models.requests import EvictionRequest

from src.settings import Settings

StreamEntries = list[tuple[str, dict[str, str]]]


class SessionTerminator(Protocol):
    async def end_all_sessions(self, email: str) -> None: ...


class EvictionConsumer:
    def __init__(
        self,
        redis: Redis,
        terminator: SessionTerminator,
        *,
        group: str,
        consumer: str,
        batch_size: int,
        block_ms: int,
        retry_interval: float,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ):
        self._redis = redis
        self._terminator = terminator
        self._task: asyncio.Task | None = None
        self._group = group
        self._consumer = consumer
        self._batch_size = batch_size
        self._block_ms = block_ms
        self._retry_interval = retry_interval
        self._sleep = sleep

    async def _ensure_group(self) -> None:
        """Create the consumer group, starting from the oldest entry in the stream."""
        try:
            await self._redis.xgroup_create(
                RedisKeys.EVICTIONS, self._group, id="0", mkstream=True
            )
            logger.info(f"Created consumer group {self._group}.")
        except ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
            logger.info(f"Consumer group {self._group} already exists.")

    async def _consume(self, start_id: str) -> str | None:
        """Consume eviction events from the Redis stream starting from the given ID."""
        try:
            response = await self._redis.xreadgroup(
                groupname=self._group,
                consumername=self._consumer,
                streams={RedisKeys.EVICTIONS: start_id},
                count=self._batch_size,
                block=self._block_ms,
            )
        except TimeoutError:
            return None
        except Exception as e:
            logger.exception(f"Failed to read eviction events: {e}")
            await self._sleep(self._retry_interval)
            return None

        last_id = None
        streams = cast(list[tuple[str, StreamEntries]], response or [])
        for _, entries in streams:
            for entry_id, fields in entries:
                await self._handle_event(entry_id, fields)
                last_id = entry_id
        return last_id

    async def _handle_event(self, event_id: str, event_data: dict[str, str]) -> None:
        """Process a single eviction event."""
        try:
            request = EvictionRequest.from_fields(event_data)
        except ValidationError as e:
            logger.warning(f"Discarding malformed eviction event {event_id}: {e}")
            await self._ack(event_id)
            return

        try:
            await self._terminator.end_all_sessions(request.email)
        except Exception as e:
            logger.exception(
                f"Failed to evict {request.email}, leaving {event_id} pending: {e}"
            )
            return

        await self._ack(event_id)
        logger.info(f"Evicted user: {request.email}")

    async def _ack(self, event_id: str) -> None:
        """Acknowledge the processed eviction event in the Redis stream."""
        try:
            await self._redis.xack(RedisKeys.EVICTIONS, self._group, event_id)
        except Exception as e:
            logger.warning(f"Failed to acknowledge eviction event {event_id}: {e}")

    async def _run(self) -> None:
        """Run the eviction consumer, processing events from the Redis stream."""
        await self._ensure_group()
        logger.info(f"Started eviction consumer: {self._consumer}")

        backlog_id = "0"
        logger.info("Processing backlog of eviction events.")
        while backlog_id is not None:
            backlog_id = await self._consume(backlog_id)

        logger.info("Finished processing backlog, switching to live consumption.")
        while True:
            await self._consume(">")

    def start(self) -> None:
        """Start the consumer in a background task."""
        if self._task is not None:
            logger.warning("Eviction consumer already started.")
            return

        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        """Stop the consumer and wait for the background task to finish."""
        if self._task is None:
            logger.warning("Eviction consumer not started.")
            return

        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None
        logger.info("Stopped eviction consumer.")


def build_eviction_consumer(
    redis: Redis, terminator: SessionTerminator, settings: Settings
) -> EvictionConsumer:
    return EvictionConsumer(
        redis=redis,
        terminator=terminator,
        group=settings.evictions_group,
        consumer=settings.evictions_consumer,
        batch_size=settings.evictions_batch_size,
        block_ms=settings.evictions_block_ms,
        retry_interval=settings.evictions_retry_interval,
    )
