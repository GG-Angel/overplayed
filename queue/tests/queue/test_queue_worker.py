import asyncio

from services.queue import QueueWorker, build_queue_worker
from settings import settings


class RecordingQueueProcessor:
    def __init__(self, failures: int = 0) -> None:
        self.calls = 0
        self._failures = failures

    async def process_queue(self) -> None:
        await asyncio.sleep(0)
        self.calls += 1
        if self.calls <= self._failures:
            raise RuntimeError("processing failed")


class BlockingSleep:
    def __init__(self, block_after: int = 1) -> None:
        self.intervals: list[float] = []
        self.started = asyncio.Event()
        self._block_after = block_after

    async def __call__(self, interval: float) -> None:
        self.intervals.append(interval)
        if len(self.intervals) >= self._block_after:
            self.started.set()
            await asyncio.Event().wait()


async def test_worker_processes_queue_until_stopped() -> None:
    processor = RecordingQueueProcessor()
    sleep = BlockingSleep()
    worker = QueueWorker(processor, poll_interval=10, sleep=sleep)

    worker.start()
    await asyncio.wait_for(sleep.started.wait(), timeout=1)
    await worker.stop()

    assert processor.calls == 1
    assert sleep.intervals == [10]


async def test_worker_continues_after_processing_failure() -> None:
    processor = RecordingQueueProcessor(failures=1)
    sleep = BlockingSleep(block_after=2)
    worker = QueueWorker(processor, poll_interval=5, sleep=sleep)

    worker.start()
    await asyncio.wait_for(sleep.started.wait(), timeout=1)
    await worker.stop()

    assert processor.calls == 2
    assert sleep.intervals == [5, 5]


async def test_start_does_not_create_a_second_worker() -> None:
    processor = RecordingQueueProcessor()
    sleep = BlockingSleep()
    worker = QueueWorker(processor, poll_interval=10, sleep=sleep)

    worker.start()
    worker.start()
    await asyncio.wait_for(sleep.started.wait(), timeout=1)
    await worker.stop()

    assert processor.calls == 1


def test_build_queue_worker() -> None:
    worker = build_queue_worker(RecordingQueueProcessor())

    assert isinstance(worker, QueueWorker)
    assert worker._poll_interval == settings.queue_poll_interval
