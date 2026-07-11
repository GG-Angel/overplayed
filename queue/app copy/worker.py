import asyncio
from loguru import logger
from service import QueueService


class QueueWorker:
    POLL_INTERVAL = 300

    def __init__(self, queue: QueueService):
        self._queue = queue
        self._task: asyncio.Task | None = None

    async def _run(self) -> None:
        logger.info("Started queue worker.")
        while True:
            logger.info("Queue processing started.")
            try:
                await self._queue.process()
            except Exception:
                logger.exception("Queue processing cycle failed.")
            logger.info(f"Sleeping for {self.POLL_INTERVAL}s...")
            await asyncio.sleep(self.POLL_INTERVAL)

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
