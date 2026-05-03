"""
Integration tests for API endpoints!
- Requires SESSION_ID env variable from a logged-in Spotify session.
- Run `SESSION_ID=<your_session_id> pytest test.py -v`
"""

import pytest
from os import environ
from aiohttp import ClientSession, ClientTimeout

BASE_URL = "http://127.0.0.1:8080"
SESSION_ID = environ["SESSION_ID"]


@pytest.fixture
async def client():
    cookies = {"session_id": SESSION_ID}
    async with ClientSession(
        base_url=BASE_URL, cookies=cookies, timeout=ClientTimeout(total=15)
    ) as session:
        yield session


class TestPlaylists:
    async def test_get_playlists(self, client: ClientSession):
        pass

    async def test_get_playlist(self, client: ClientSession):
        pass

    async def test_get_playlist_tracks(self, client: ClientSession):
        pass

    async def test_create_playlist(self, client: ClientSession):
        pass

    async def test_add_playlist_tracks(self, client: ClientSession):
        pass

    async def test_remove_playlist_tracks(self, client: ClientSession):
        pass
