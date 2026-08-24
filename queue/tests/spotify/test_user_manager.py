import asyncio
from datetime import UTC, datetime

import pytest
from core.errors import SpotifyUserManagementError
from fakeredis.aioredis import FakeRedis
from models.spotify import (
    SpotifyUser,
    SpotifyUserCreationRequest,
    SpotifyUsersResponse,
)
from services.spotify.manager import SpotifyUserManager

from .common import FakeResponse, RecordingHttpClient, RequestCall

APP_CLIENT_ID = "app-client"
ACCESS_TOKEN = "access-token"
READ_URL = f"https://developer.spotify.com/api/s4d/warp/clients/{APP_CLIENT_ID}/users"
WRITE_URL = f"https://developer.spotify.com/api/ws4d/warp/clients/{APP_CLIENT_ID}/users"
USERS_KEY = "queue:active_users"
USERS_TTL = 300


class RecordingTokenProvider:
    def __init__(self) -> None:
        self.calls = 0

    async def get_token(self) -> str:
        await asyncio.sleep(0)
        self.calls += 1
        return ACCESS_TOKEN


@pytest.fixture
def user() -> SpotifyUser:
    return SpotifyUser(
        id="user-id",
        name="Test User",
        email="user@example.com",
        client_id=APP_CLIENT_ID,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )


def create_manager(
    http_client: RecordingHttpClient,
    redis_client: FakeRedis,
    tokens: RecordingTokenProvider,
) -> SpotifyUserManager:
    return SpotifyUserManager(
        http_client=http_client,
        redis=redis_client,
        tokens=tokens,
        app_client_id=APP_CLIENT_ID,
        users_ttl=USERS_TTL,
    )


def request_options() -> dict[str, object]:
    return {
        "headers": {"Authorization": f"Bearer {ACCESS_TOKEN}"},
        "raise_for_status": True,
    }


async def test_get_users_returns_cached_users(
    redis_client: FakeRedis,
    user: SpotifyUser,
) -> None:
    await redis_client.set(
        USERS_KEY,
        SpotifyUsersResponse(users=[user]).model_dump_json(),
    )
    http_client = RecordingHttpClient()
    tokens = RecordingTokenProvider()
    manager = create_manager(http_client, redis_client, tokens)

    assert await manager.get_users() == [user]
    assert http_client.calls == []
    assert tokens.calls == 0


async def test_get_users_fetches_and_caches_users(
    redis_client: FakeRedis,
    user: SpotifyUser,
) -> None:
    http_client = RecordingHttpClient(
        get_responses=[
            FakeResponse({"users": [user.model_dump(mode="json")]}),
        ]
    )
    tokens = RecordingTokenProvider()
    manager = create_manager(http_client, redis_client, tokens)

    assert await manager.get_users() == [user]
    assert http_client.calls == [RequestCall("GET", READ_URL, request_options())]
    assert tokens.calls == 1
    cached_users = await redis_client.get(USERS_KEY)
    assert cached_users is not None
    assert SpotifyUsersResponse.model_validate_json(cached_users).users == [user]
    assert 0 < await redis_client.ttl(USERS_KEY) <= USERS_TTL


async def test_user_lookups_use_active_users(
    redis_client: FakeRedis,
    user: SpotifyUser,
) -> None:
    await redis_client.set(
        USERS_KEY,
        SpotifyUsersResponse(users=[user]).model_dump_json(),
    )
    manager = create_manager(
        RecordingHttpClient(),
        redis_client,
        RecordingTokenProvider(),
    )

    assert await manager.has_user(user.email) is True
    assert await manager.has_user("missing@example.com") is False
    assert await manager.get_user(user.email) == user
    assert await manager.get_user("missing@example.com") is None


async def test_add_user_activates_user_and_clears_cache(
    redis_client: FakeRedis,
    user: SpotifyUser,
) -> None:
    await redis_client.set(USERS_KEY, "cached-users")
    http_client = RecordingHttpClient(
        post_responses=[FakeResponse(user.model_dump(mode="json"))]
    )
    tokens = RecordingTokenProvider()
    manager = create_manager(http_client, redis_client, tokens)
    new_user = SpotifyUserCreationRequest(name=user.name, email=user.email)

    assert await manager.add_user(new_user) == user
    assert http_client.calls == [
        RequestCall(
            "POST",
            WRITE_URL,
            {
                **request_options(),
                "json": new_user.model_dump(),
            },
        )
    ]
    assert tokens.calls == 1
    assert await redis_client.get(USERS_KEY) is None


async def test_remove_user_deactivates_user_and_clears_cache(
    redis_client: FakeRedis,
    user: SpotifyUser,
) -> None:
    await redis_client.set(USERS_KEY, "cached-users")
    http_client = RecordingHttpClient(delete_responses=[FakeResponse()])
    tokens = RecordingTokenProvider()
    manager = create_manager(http_client, redis_client, tokens)

    await manager.remove_user(user)

    assert http_client.calls == [
        RequestCall(
            "DELETE",
            f"{WRITE_URL}/id/{user.id}",
            request_options(),
        )
    ]
    assert tokens.calls == 1
    assert await redis_client.get(USERS_KEY) is None


async def test_get_users_wraps_request_errors(redis_client: FakeRedis) -> None:
    http_client = RecordingHttpClient(
        get_responses=[FakeResponse(error=RuntimeError("request failed"))]
    )
    manager = create_manager(
        http_client,
        redis_client,
        RecordingTokenProvider(),
    )

    with pytest.raises(
        SpotifyUserManagementError,
        match="Failed to fetch active users.",
    ):
        await manager.get_users()


async def test_add_user_wraps_request_errors(redis_client: FakeRedis) -> None:
    http_client = RecordingHttpClient(
        post_responses=[FakeResponse(error=RuntimeError("request failed"))]
    )
    manager = create_manager(
        http_client,
        redis_client,
        RecordingTokenProvider(),
    )
    new_user = SpotifyUserCreationRequest(
        name="Test User",
        email="user@example.com",
    )

    with pytest.raises(
        SpotifyUserManagementError,
        match="Failed to add user user@example.com.",
    ):
        await manager.add_user(new_user)


async def test_remove_user_wraps_request_errors(
    redis_client: FakeRedis,
    user: SpotifyUser,
) -> None:
    http_client = RecordingHttpClient(
        delete_responses=[FakeResponse(error=RuntimeError("request failed"))]
    )
    manager = create_manager(
        http_client,
        redis_client,
        RecordingTokenProvider(),
    )

    with pytest.raises(
        SpotifyUserManagementError,
        match="Failed to remove user user@example.com.",
    ):
        await manager.remove_user(user)
