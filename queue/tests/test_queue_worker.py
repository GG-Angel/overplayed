"""Unit tests for QueueWorker (app/services/queue.py)."""

import asyncio
from unittest.mock import AsyncMock

from services.queue import QueueWorker


class TestStart:
    async def test_happy_path_creates_background_task(self, mocker):
        queue_service = mocker.Mock()
        queue_service.process_queue = AsyncMock(side_effect=asyncio.CancelledError())
        worker = QueueWorker(queue_service)

        worker.start()
        assert worker._task is not None

        worker._task.cancel()
        await asyncio.gather(worker._task, return_exceptions=True)

    async def test_boundary_calling_start_twice_does_not_create_second_task(
        self, mocker
    ):
        queue_service = mocker.Mock()
        queue_service.process_queue = AsyncMock(side_effect=asyncio.CancelledError())
        worker = QueueWorker(queue_service)

        worker.start()
        first_task = worker._task
        worker.start()

        assert worker._task is first_task

        worker._task.cancel()
        await asyncio.gather(worker._task, return_exceptions=True)


class TestStop:
    async def test_happy_path_cancels_running_task(self, mocker):
        queue_service = mocker.Mock()
        queue_service.process_queue = AsyncMock(return_value=None)
        worker = QueueWorker(queue_service)
        worker._poll_interval = 100  # avoid tight loop before we cancel
        worker.start()
        await asyncio.sleep(0)  # let the task start

        await worker.stop()  # should not raise; cancellation is suppressed

        assert worker._task.cancelled()

    async def test_boundary_stop_without_start_does_not_raise(self, mocker):
        queue_service = mocker.Mock()
        worker = QueueWorker(queue_service)

        await worker.stop()  # should log a warning, not raise


class TestRun:
    async def test_exception_process_queue_failure_is_caught_and_loop_continues(
        self, mocker
    ):
        queue_service = mocker.Mock()
        call_count = 0

        async def process_queue_side_effect():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise RuntimeError("cycle failed")
            raise asyncio.CancelledError()  # stop the loop on the second iteration

        queue_service.process_queue = AsyncMock(side_effect=process_queue_side_effect)
        worker = QueueWorker(queue_service)
        mocker.patch("services.queue.asyncio.sleep", AsyncMock(return_value=None))

        worker.start()
        await asyncio.gather(worker._task, return_exceptions=True)

        assert call_count == 2  # first failed & was caught, second stopped the loop
