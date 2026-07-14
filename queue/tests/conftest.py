import asyncio
import pytest
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncIterator, Callable
from unittest.mock import MagicMock
from cryptography.fernet import Fernet
from fakeredis.aioredis import FakeRedis
from models import ActiveUser, NewUser, QueuedUser

DEFAULT_NAME = "Ada Lovelace"
DEFAULT_EMAIL = "ada@example.com"


@pytest.fixture
async def fake_redis() -> AsyncIterator[FakeRedis]:
    """A fakeredis-backed async Redis client for simple key/hash/list operations."""
    redis = FakeRedis()
    try:
        yield redis
    finally:
        await redis.aclose()


@pytest.fixture
def fernet_key() -> bytes:
    """A generated Fernet key for use with real encryption in tests."""
    return Fernet.generate_key()


class FakeResponse:
    """A minimal stand-in for an aiohttp.ClientResponse."""

    def __init__(
        self,
        *,
        json_data: Any = None,
        text_data: str = "",
        status: int = 200,
        raise_error: Exception | None = None,
    ):
        self._json_data = json_data
        self._text_data = text_data
        self.status = status
        self._raise_error = raise_error

    async def json(self) -> Any:
        await asyncio.sleep(0)
        return self._json_data

    async def text(self) -> str:
        await asyncio.sleep(0)
        return self._text_data

    def raise_for_status(self) -> None:
        if self._raise_error is not None:
            raise self._raise_error


@pytest.fixture
def make_http_response() -> Callable[..., FakeResponse]:
    """Factory for building FakeResponse instances."""
    return FakeResponse


@pytest.fixture
def mock_http() -> MagicMock:
    """
    A mocked aiohttp.ClientSession whose get/post/delete methods return async
    context managers yielding a configurable FakeResponse. Configure per-test via:

        http.get.return_value = make_async_cm(FakeResponse(...))
    """
    session = MagicMock()
    session.get = MagicMock()
    session.post = MagicMock()
    session.delete = MagicMock()
    return session


@pytest.fixture
def make_async_cm() -> Callable[[Any], Any]:
    """Wrap a value (e.g. a FakeResponse) as an async context manager."""

    def _make(value: Any):
        @asynccontextmanager
        async def _cm():
            yield value

        return _cm()

    return _make


@pytest.fixture
def make_new_user() -> Callable[..., NewUser]:
    def _make(name: str = DEFAULT_NAME, email: str = DEFAULT_EMAIL) -> NewUser:
        return NewUser(name=name, email=email)

    return _make


@pytest.fixture
def make_queued_user() -> Callable[..., QueuedUser]:
    def _make(
        name: str = DEFAULT_NAME,
        email: str = DEFAULT_EMAIL,
        retries: int = 0,
        created_at: datetime | None = None,
    ) -> QueuedUser:
        return QueuedUser(
            name=name,
            email=email,
            retries=retries,
            created_at=created_at or datetime.now(timezone.utc),
        )

    return _make


@pytest.fixture
def make_active_user() -> Callable[..., ActiveUser]:
    def _make(
        id: str = "user-1",
        name: str = DEFAULT_NAME,
        email: str = DEFAULT_EMAIL,
        client_id: str = "client-1",
        created_at: datetime | None = None,
    ) -> ActiveUser:
        return ActiveUser(
            id=id,
            name=name,
            email=email,
            client_id=client_id,
            created_at=created_at or datetime.now(timezone.utc),
        )

    return _make
