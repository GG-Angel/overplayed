"""Unit tests for QueueService (app/services/queue.py)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest

from errors import SpotifySessionError, SpotifyValidationError
from services.queue import QueueRepository, QueueService


def make_service(fake_redis, mocker, *, lock=None):
    user_manager = mocker.Mock()
    user_validator = mocker.Mock()
    queue = QueueRepository(fake_redis)
    if lock is None:
        lock = mocker.AsyncMock()
        lock.__aenter__.return_value = lock
        lock.__aexit__.return_value = False
    service = QueueService(
        user_manager=user_manager,
        user_validator=user_validator,
        queue=queue,
        lock=lock,
    )
    return service, user_manager, user_validator, queue, lock


class TestGetUserStatus:
    async def test_happy_path_in_queue(self, fake_redis, mocker, make_new_user):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        user_manager.get_user = AsyncMock(return_value=None)
        user_manager.get_users = AsyncMock(return_value=[])
        await queue.push(make_new_user(email="queued@example.com"))

        status = await service.get_user_status("queued@example.com")

        assert status.status == "in_queue"
        assert status.position == 1

    async def test_happy_path_active(self, fake_redis, mocker, make_active_user):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        active_user = make_active_user(email="active@example.com")
        user_manager.get_user = AsyncMock(return_value=active_user)

        status = await service.get_user_status("active@example.com")

        assert status.status == "active"
        assert status.user == active_user

    async def test_happy_path_not_in_queue(self, fake_redis, mocker):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        user_manager.get_user = AsyncMock(return_value=None)

        status = await service.get_user_status("nobody@example.com")

        assert status.status == "not_in_queue"


class TestGetQueueOverview:
    async def test_happy_path_below_capacity_no_wait_time(
        self, fake_redis, mocker, make_active_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        user_manager.get_users = AsyncMock(return_value=[make_active_user()])

        overview = await service.get_queue_overview()

        assert overview.next_available_time is None
        assert overview.user_limit == 5

    async def test_boundary_at_capacity_computes_wait_time(
        self, fake_redis, mocker, make_active_user, make_new_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        active_users = [make_active_user(id=str(i), email=f"u{i}@x.com") for i in range(5)]
        user_manager.get_users = AsyncMock(return_value=active_users)
        await queue.push(make_new_user(email="waiting@example.com"))

        overview = await service.get_queue_overview()

        assert overview.next_available_time is not None
        assert len(overview.queued_users) == 1


class TestEstimateStartTime:
    async def test_boundary_no_active_users_starts_immediately(
        self, fake_redis, mocker
    ):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        user_manager.get_users = AsyncMock(return_value=[])

        start = await service._estimate_start_time(1)

        assert start <= datetime.now(timezone.utc)

    async def test_boundary_full_capacity_delays_start(
        self, fake_redis, mocker, make_active_user
    ):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        now = datetime.now(timezone.utc)
        active_users = [
            make_active_user(id=str(i), email=f"u{i}@x.com", created_at=now)
            for i in range(5)
        ]
        user_manager.get_users = AsyncMock(return_value=active_users)

        start = await service._estimate_start_time(1)

        assert start >= now + timedelta(hours=24) - timedelta(seconds=5)


class TestEnqueueUser:
    async def test_happy_path_enqueues_and_returns_status(
        self, fake_redis, mocker, make_new_user
    ):
        service, user_manager, user_validator, _, lock = make_service(
            fake_redis, mocker
        )
        user_manager.has_user = AsyncMock(return_value=False)
        user_manager.get_user = AsyncMock(return_value=None)
        user_manager.get_users = AsyncMock(return_value=[])
        user_validator.user_exists = AsyncMock(return_value=True)

        status = await service.enqueue_user(
            make_new_user(name="Ada", email="ada@example.com")
        )

        assert status.status == "in_queue"
        lock.__aenter__.assert_awaited()
        lock.__aexit__.assert_awaited()

    async def test_exception_already_queued_raises_session_error(
        self, fake_redis, mocker, make_new_user
    ):
        service, user_manager, user_validator, queue, _ = make_service(
            fake_redis, mocker
        )
        await queue.push(make_new_user(email="dup@example.com"))

        with pytest.raises(SpotifySessionError, match="Already in queue"):
            await service.enqueue_user(make_new_user(email="dup@example.com"))

    async def test_exception_already_active_raises_session_error(
        self, fake_redis, mocker, make_new_user
    ):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        user_manager.has_user = AsyncMock(return_value=True)

        with pytest.raises(SpotifySessionError, match="Already active"):
            await service.enqueue_user(make_new_user(email="active@example.com"))

    async def test_exception_nonexistent_spotify_user_raises_validation_error(
        self, fake_redis, mocker, make_new_user
    ):
        service, user_manager, user_validator, _, _ = make_service(fake_redis, mocker)
        user_manager.has_user = AsyncMock(return_value=False)
        user_validator.user_exists = AsyncMock(return_value=False)

        with pytest.raises(SpotifyValidationError, match="does not exist"):
            await service.enqueue_user(make_new_user(email="ghost@example.com"))


class TestProcessQueue:
    async def test_happy_path_fills_slots_from_queue(
        self, fake_redis, mocker, make_new_user, make_active_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        user_manager.get_users = AsyncMock(return_value=[])
        activated = make_active_user(email="new@example.com")
        user_manager.add_user = AsyncMock(return_value=activated)
        user_manager.remove_user = AsyncMock()
        await queue.push(make_new_user(name="New", email="new@example.com"))

        await service.process_queue()

        assert await queue.size() == 0

    async def test_boundary_rejected_user_below_retry_limit_is_retried(
        self, fake_redis, mocker, make_new_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        user_manager.get_users = AsyncMock(return_value=[])
        user_manager.add_user = AsyncMock(side_effect=RuntimeError("full"))
        user_manager.remove_user = AsyncMock()
        await queue.push(make_new_user(name="Retry", email="retry@example.com"))

        await service.process_queue()

        dumped = await queue.dump()
        assert len(dumped.users) == 1
        assert dumped.users[0].retries == 1

    async def test_boundary_rejected_user_at_retry_limit_is_dropped(
        self, fake_redis, mocker, make_new_user, make_queued_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        user_manager.get_users = AsyncMock(return_value=[])
        user_manager.add_user = AsyncMock(side_effect=RuntimeError("full"))
        user_manager.remove_user = AsyncMock()
        await queue.retry(
            make_queued_user(name="MaxedOut", email="maxed@example.com", retries=3)
        )

        await service.process_queue()

        dumped = await queue.dump()
        assert len(dumped.users) == 0


class TestPruneExpiredUsers:
    async def test_happy_path_removes_expired_users(
        self, fake_redis, mocker, make_active_user
    ):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        expired = make_active_user(
            id="expired",
            email="expired@example.com",
            created_at=datetime.now(timezone.utc) - timedelta(hours=25),
        )
        user_manager.get_users = AsyncMock(return_value=[expired])
        user_manager.remove_user = AsyncMock()

        result = await service._prune_expired_users()

        assert result.evicted_users == [expired]
        user_manager.remove_user.assert_awaited_once_with(expired)

    async def test_exception_removal_failure_is_caught_and_skipped(
        self, fake_redis, mocker, make_active_user
    ):
        service, user_manager, _, _, _ = make_service(fake_redis, mocker)
        expired = make_active_user(
            id="expired",
            email="expired@example.com",
            created_at=datetime.now(timezone.utc) - timedelta(hours=25),
        )
        user_manager.get_users = AsyncMock(return_value=[expired])
        user_manager.remove_user = AsyncMock(side_effect=RuntimeError("boom"))

        result = await service._prune_expired_users()

        assert result.evicted_users == []  # not raised, simply not recorded


class TestFillAvailableSlots:
    async def test_boundary_no_available_slots_is_noop(
        self, fake_redis, mocker, make_active_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        full_users = [make_active_user(id=str(i), email=f"u{i}@x.com") for i in range(5)]
        user_manager.get_users = AsyncMock(return_value=full_users)

        result = await service._fill_available_slots()

        assert result.activated_users == []
        assert result.rejected_users == []

    async def test_exception_add_user_failure_rejects_and_continues(
        self, fake_redis, mocker, make_new_user, make_active_user
    ):
        service, user_manager, _, queue, _ = make_service(fake_redis, mocker)
        user_manager.get_users = AsyncMock(return_value=[])
        activated = make_active_user(email="second@example.com")
        user_manager.add_user = AsyncMock(
            side_effect=[RuntimeError("full"), activated]
        )
        await queue.push(make_new_user(name="First", email="first@example.com"))
        await queue.push(make_new_user(name="Second", email="second@example.com"))

        result = await service._fill_available_slots()

        assert len(result.rejected_users) == 1
        assert result.rejected_users[0].name == "First"
        assert result.activated_users == [activated]
