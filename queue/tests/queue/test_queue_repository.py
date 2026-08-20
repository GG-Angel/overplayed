from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
from fakeredis.aioredis import FakeRedis
from models.queue import QueuedUser, QueuedUserPosition
from services.queue import QueueRepository, build_queue_repository

NOW = datetime(2026, 1, 2, 12, tzinfo=UTC)


@pytest.fixture
async def redis_client() -> AsyncIterator[FakeRedis]:
    client = FakeRedis(decode_responses=True)
    yield client
    await client.aclose()


@pytest.fixture
def repository(redis_client: FakeRedis) -> QueueRepository:
    return QueueRepository(redis_client, now_factory=lambda: NOW)


async def test_push_adds_user_to_back_of_queue(
    repository: QueueRepository,
) -> None:
    assert await repository.push("first@example.com") == 1
    assert await repository.push("second@example.com") == 2
    assert await repository.dump() == [
        QueuedUser(email="first@example.com", retries=0, created_at=NOW),
        QueuedUser(email="second@example.com", retries=0, created_at=NOW),
    ]


async def test_retry_adds_user_to_front_of_queue(
    repository: QueueRepository,
) -> None:
    first = QueuedUser(email="first@example.com", retries=1, created_at=NOW)
    second = QueuedUser(email="second@example.com", retries=0, created_at=NOW)
    await repository.push(second.email)

    assert await repository.retry(first) == 2
    assert await repository.pop(count=2) == [first, second]


async def test_pop_empty_queue_returns_empty_list(
    repository: QueueRepository,
) -> None:
    assert await repository.pop() == []


async def test_get_has_and_size_report_queue_state(
    repository: QueueRepository,
) -> None:
    await repository.push("first@example.com")
    second = QueuedUser(email="second@example.com", retries=0, created_at=NOW)
    await repository.push(second.email)

    assert await repository.get(second.email) == QueuedUserPosition(
        user=second,
        position=2,
    )
    assert await repository.get("missing@example.com") is None
    assert await repository.has("first@example.com") is True
    assert await repository.has("missing@example.com") is False
    assert await repository.size() == 2


def test_build_queue_repository(redis_client: FakeRedis) -> None:
    assert isinstance(build_queue_repository(redis_client), QueueRepository)
