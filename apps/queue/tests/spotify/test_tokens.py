import pytest
from fakeredis.aioredis import FakeRedis

from app.core.errors import SpotifyTokenError
from app.services.spotify.tokens import SpotifyTokenProvider

from .common import FakeResponse, RecordingHttpClient, RequestCall

AUTH_CLIENT_ID = "auth-client"
TOKEN_URL = "https://accounts.spotify.com/api/token"


class TestCipher:
    def encrypt(self, data: str) -> str:
        return f"encrypted:{data}"

    def decrypt(self, token: str) -> str:
        return token.removeprefix("encrypted:")


def create_provider(
    http_client: RecordingHttpClient,
    redis_client: FakeRedis,
) -> SpotifyTokenProvider:
    return SpotifyTokenProvider(
        http=http_client,
        redis=redis_client,
        crypto=TestCipher(),
        auth_client_id=AUTH_CLIENT_ID,
    )


def token_response() -> dict[str, object]:
    return {
        "access_token": "new-access-token",
        "refresh_token": "new-refresh-token",
        "expires_in": 3600,
    }


async def test_get_token_returns_stored_access_token(
    redis_client: FakeRedis,
) -> None:
    await redis_client.set("queue:access_token", "encrypted:stored-access-token")
    provider = create_provider(RecordingHttpClient(), redis_client)

    assert await provider.get_token() == "stored-access-token"


async def test_get_token_renews_and_stores_tokens(
    redis_client: FakeRedis,
) -> None:
    await redis_client.set("queue:refresh_token", "encrypted:old-refresh-token")
    http_client = RecordingHttpClient(post_responses=[FakeResponse(token_response())])
    provider = create_provider(http_client, redis_client)

    assert await provider.get_token() == "new-access-token"
    assert http_client.calls == [
        RequestCall(
            "POST",
            TOKEN_URL,
            {
                "raise_for_status": True,
                "data": {
                    "grant_type": "refresh_token",
                    "refresh_token": "old-refresh-token",
                    "client_id": AUTH_CLIENT_ID,
                },
            },
        )
    ]
    assert await redis_client.get("queue:access_token") == (
        "encrypted:new-access-token"
    )
    assert await redis_client.get("queue:refresh_token") == (
        "encrypted:new-refresh-token"
    )
    assert 0 < await redis_client.ttl("queue:access_token") <= 3540


async def test_get_token_requires_refresh_token(redis_client: FakeRedis) -> None:
    provider = create_provider(RecordingHttpClient(), redis_client)

    with pytest.raises(
        SpotifyTokenError,
        match="No refresh token available to renew access token.",
    ):
        await provider.get_token()


async def test_get_token_wraps_renewal_errors(redis_client: FakeRedis) -> None:
    await redis_client.set("queue:refresh_token", "encrypted:refresh-token")
    http_client = RecordingHttpClient(
        post_responses=[FakeResponse(error=RuntimeError("request failed"))]
    )
    provider = create_provider(http_client, redis_client)

    with pytest.raises(
        SpotifyTokenError,
        match="Failed to renew access token.",
    ):
        await provider.get_token()


async def test_seed_token_stores_tokens(redis_client: FakeRedis) -> None:
    http_client = RecordingHttpClient(post_responses=[FakeResponse(token_response())])
    provider = create_provider(http_client, redis_client)

    await provider.seed_token("seed-refresh-token")

    assert http_client.calls[0].kwargs["data"] == {
        "grant_type": "refresh_token",
        "refresh_token": "seed-refresh-token",
        "client_id": AUTH_CLIENT_ID,
    }
    assert await redis_client.get("queue:access_token") == (
        "encrypted:new-access-token"
    )
    assert await redis_client.get("queue:refresh_token") == (
        "encrypted:new-refresh-token"
    )


async def test_seed_token_does_not_replace_stored_refresh_token(
    redis_client: FakeRedis,
) -> None:
    await redis_client.set("queue:refresh_token", "encrypted:stored-refresh-token")
    http_client = RecordingHttpClient()
    provider = create_provider(http_client, redis_client)

    await provider.seed_token("seed-refresh-token")

    assert http_client.calls == []
    assert await redis_client.get("queue:refresh_token") == (
        "encrypted:stored-refresh-token"
    )


async def test_seed_token_wraps_renewal_errors(redis_client: FakeRedis) -> None:
    http_client = RecordingHttpClient(
        post_responses=[FakeResponse(error=RuntimeError("request failed"))]
    )
    provider = create_provider(http_client, redis_client)

    with pytest.raises(
        SpotifyTokenError,
        match="Failed to seed refresh token.",
    ):
        await provider.seed_token("seed-refresh-token")
