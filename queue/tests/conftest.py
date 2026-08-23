import os
from collections.abc import AsyncIterator

import pytest
from fakeredis.aioredis import FakeRedis

TEST_SETTINGS = {
    "APP_FRONTEND_URL": "https://overplayed.example.com",
    "APP_API_URL": "https://api-overplayed.example.com",
    "SPOTIFY_CLIENT_ID": "spotify-client",
    "SPOTIFY_AUTH_CLIENT_ID": "spotify-auth-client",
    "SPOTIFY_REFRESH_TOKEN": "spotify-refresh-token",
    "REDIS_USER": "redis-user",
    "REDIS_HOST": "localhost",
    "REDIS_PORT": "6379",
    "REDIS_PASSWORD": "redis-password",
    "REDIS_KEY": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "CLOUDFLARE_TURNSTILE_SECRET": "turnstile-secret",
    "RESEND_API_KEY": "resend-key",
}

for name, value in TEST_SETTINGS.items():
    os.environ.setdefault(name, value)


@pytest.fixture
async def redis_client() -> AsyncIterator[FakeRedis]:
    client = FakeRedis(decode_responses=True)
    yield client
    await client.aclose()
