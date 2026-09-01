import asyncio
from collections.abc import Awaitable, Callable
from typing import Protocol

from loguru import logger

from app.settings import settings


class QueueProcessor(Protocol):
    async def process_queue(self) -> None: ...


class QueueWorker:
    def __init__(
        self,
        queue_service: QueueProcessor,
        *,
        poll_interval: float,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ):
        self._queue_service = queue_service
        self._task: asyncio.Task | None = None
        self._poll_interval = poll_interval
        self._sleep = sleep

    async def _run(self) -> None:
        logger.info("Started queue worker.")
        while True:
            logger.info("Processing queue...")
            try:
                await self._queue_service.process_queue()
            except Exception as e:
                logger.exception(f"Queue processing cycle failed: {e}.")
            logger.info(f"Processing complete. Sleeping for {self._poll_interval}s...")
            await self._sleep(self._poll_interval)

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


def build_queue_worker(queue_service: QueueProcessor) -> QueueWorker:
    """Build a QueueWorker for the queue service."""
    return QueueWorker(
        queue_service,
        poll_interval=settings.queue_poll_interval,
    )
