"""
API Integration Tests :3
- Requires all services to be running using Docker Compose.
- Requires a SESSION_ID cookie from a logged-in Spotify session.
- To run destructive tests, create a test playlist on your Spotify account.
- Run `SESSION_ID="your_session_id" uv run pytest -v`
"""

import os

import pytest
from aiohttp import ClientSession, ClientTimeout

BASE_URL = "http://127.0.0.1:8080"
TEST_PLAYLIST_NAME = "Overplayed Testing"
TEST_PLAYLIST_MIN_TRACKS = 2


@pytest.fixture()
async def session():
    cookies = {"session_id": os.environ["SESSION_ID"]}
    async with ClientSession(
        base_url=BASE_URL,
        cookies=cookies,
        timeout=ClientTimeout(total=15),
    ) as session:
        yield session
