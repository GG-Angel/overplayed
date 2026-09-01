import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from shared.models.requests import EvictionRequest

from app.core.errors import UnknownUserError
from app.core.lock import DistributedLock
from app.models.queue import (
    ActiveUserStatus,
    QueuedUser,
    QueuedUserPosition,
    QueuedUserStatus,
)
from app.models.spotify import SpotifyUser, SpotifyUserCreationRequest
from app.services.queue import EmailService, QueueRepository, QueueService
from app.services.spotify import SpotifyUserManager, SpotifyUserValidator

NOW = datetime(2026, 1, 2, 12, tzinfo=UTC)
USER_TTL = 3600


@dataclass
class QueueServiceHarness:
    service: QueueService
    user_manager: AsyncMock
    user_validator: AsyncMock
    emailer: AsyncMock
    queue: AsyncMock
    lock: AsyncMock


def spotify_user(
    email: str = "user@example.com",
    *,
    created_at: datetime = NOW,
) -> SpotifyUser:
    return SpotifyUser(
        id=email,
        name=email,
        email=email,
        client_id="app-client",
        created_at=created_at,
    )


def queued_user(
    email: str = "user@example.com",
    *,
    retries: int = 0,
) -> QueuedUser:
    return QueuedUser(email=email, retries=retries, created_at=NOW)


def create_harness(*, user_limit: int = 1, retry_limit: int = 2) -> QueueServiceHarness:
    user_manager = AsyncMock(spec=SpotifyUserManager)
    user_manager.get_user.return_value = None
    user_manager.get_users.return_value = []
    user_manager.has_user.return_value = False

    user_validator = AsyncMock(spec=SpotifyUserValidator)
    user_validator.user_exists.return_value = True

    emailer = AsyncMock(spec=EmailService)
    emailer.send_onboarded_email.return_value = True
    emailer.has_pending_token.return_value = False

    queue = AsyncMock(spec=QueueRepository)
    queue.dump.return_value = []
    queue.get.return_value = None
    queue.has.return_value = False
    queue.pop.return_value = []

    lock = AsyncMock(spec=DistributedLock)
    lock.__aenter__.return_value = lock
    lock.__aexit__.return_value = None

    service = QueueService(
        user_manager=user_manager,
        user_validator=user_validator,
        emailer=emailer,
        queue=queue,
        lock=lock,
        user_limit=user_limit,
        retry_limit=retry_limit,
        user_ttl=USER_TTL,
        now_factory=lambda: NOW,
    )
    return QueueServiceHarness(
        service=service,
        user_manager=user_manager,
        user_validator=user_validator,
        emailer=emailer,
        queue=queue,
        lock=lock,
    )


async def test_get_user_status_returns_queued_user_with_estimated_start() -> None:
    harness = create_harness()
    queued = queued_user()
    active = spotify_user(created_at=NOW - timedelta(minutes=30))
    harness.queue.get.return_value = QueuedUserPosition(user=queued, position=2)
    harness.user_manager.get_users.return_value = [active]

    status = await harness.service.get_user_status(queued.email)

    assert status == QueuedUserStatus(
        position=2,
        user=queued,
        start_time=NOW + timedelta(minutes=90),
    )
    harness.user_manager.get_user.assert_not_awaited()


async def test_get_user_status_returns_active_user() -> None:
    harness = create_harness()
    active = spotify_user(created_at=NOW - timedelta(minutes=15))
    harness.user_manager.get_user.return_value = active

    status = await harness.service.get_user_status(active.email)

    assert status == ActiveUserStatus(
        user=active,
        end_time=NOW + timedelta(minutes=45),
    )


async def test_get_queue_overview_estimates_next_available_time() -> None:
    harness = create_harness()
    active = spotify_user(created_at=NOW - timedelta(minutes=30))
    queued = queued_user("queued@example.com")
    harness.user_manager.get_users.return_value = [active]
    harness.queue.dump.return_value = [queued]

    overview = await harness.service.get_queue_overview()

    assert overview.active_users == [active]
    assert overview.queued_users == [queued]
    assert overview.user_limit == 1
    assert overview.next_available_time == NOW + timedelta(minutes=90)


async def test_get_queue_overview_counts_slots_when_full() -> None:
    harness = create_harness(user_limit=2)
    harness.user_manager.get_users.return_value = [
        spotify_user("active@example.com"),
        spotify_user("other@example.com"),
    ]
    harness.queue.dump.return_value = [
        queued_user("queued@example.com"),
        queued_user("later@example.com"),
    ]

    overview = await harness.service.get_queue_overview()

    assert overview.filled_slots == 2
    assert overview.open_slots == 0
    assert overview.num_waiting == 2


async def test_get_queue_overview_counts_slots_when_open() -> None:
    harness = create_harness(user_limit=3)
    harness.user_manager.get_users.return_value = [spotify_user("active@example.com")]

    overview = await harness.service.get_queue_overview()

    assert overview.filled_slots == 1
    assert overview.open_slots == 2
    assert overview.num_waiting == 0
    assert overview.next_available_time is None


async def test_enqueue_user_rejects_unknown_spotify_user() -> None:
    harness = create_harness()
    harness.user_validator.user_exists.return_value = False

    with pytest.raises(UnknownUserError, match="missing@example.com does not exist"):
        await harness.service.enqueue_user("missing@example.com")

    harness.lock.__aenter__.assert_not_awaited()
    harness.queue.push.assert_not_awaited()


async def test_enqueue_user_adds_and_activates_new_user() -> None:
    harness = create_harness()
    queued = queued_user()
    active = spotify_user()
    harness.queue.pop.return_value = [queued]
    harness.user_manager.add_user.return_value = active
    harness.user_manager.get_user.return_value = active

    await harness.service.enqueue_user(queued.email)
    await asyncio.sleep(0)

    harness.queue.push.assert_awaited_once_with(queued.email)
    harness.user_manager.add_user.assert_awaited_once_with(
        SpotifyUserCreationRequest(name=queued.email, email=queued.email)
    )
    harness.emailer.send_onboarded_email.assert_awaited_once_with(queued.email)
    harness.lock.__aenter__.assert_awaited_once()
    harness.lock.__aexit__.assert_awaited_once()


async def test_process_queue_prunes_expired_user_and_fills_open_slot() -> None:
    harness = create_harness(user_limit=2)
    expired = spotify_user(
        "expired@example.com",
        created_at=NOW - timedelta(seconds=USER_TTL + 1),
    )
    current = spotify_user(
        "current@example.com",
        created_at=NOW - timedelta(minutes=30),
    )
    queued = queued_user("queued@example.com")
    activated = spotify_user("queued@example.com")
    harness.user_manager.get_users.side_effect = [
        [expired, current],
        [current],
    ]
    harness.queue.pop.return_value = [queued]
    harness.user_manager.add_user.return_value = activated

    await harness.service.process_queue()
    await asyncio.sleep(0)

    harness.user_manager.remove_user.assert_awaited_once_with(expired)
    harness.queue.pop.assert_awaited_once_with(count=1)
    harness.user_manager.add_user.assert_awaited_once()
    harness.emailer.send_onboarded_email.assert_awaited_once_with(queued.email)
    harness.emailer.publish_eviction.assert_awaited_once_with(
        EvictionRequest(email=expired.email)
    )


async def test_process_queue_retries_failed_activation_within_limit() -> None:
    harness = create_harness(user_limit=2, retry_limit=2)
    retryable = queued_user("retry@example.com", retries=1)
    exhausted = queued_user("exhausted@example.com", retries=2)
    harness.queue.pop.return_value = [retryable, exhausted]
    harness.user_manager.add_user.side_effect = RuntimeError("activation failed")

    await harness.service.process_queue()

    assert retryable.retries == 2
    harness.queue.retry.assert_awaited_once_with(retryable)
    harness.emailer.send_onboarded_email.assert_not_awaited()
