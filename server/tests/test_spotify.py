"""
Integration tests for API endpoints!
- Requires SESSION_ID env variable from a logged-in Spotify session.
- Run `SESSION_ID=<your_session_id> uv run pytest tests/ -v`
"""

from asyncio import sleep

import pytest
from loguru import logger
from os import environ
from aiohttp import ClientSession, ClientTimeout

BASE_URL = "http://127.0.0.1:8080"
SESSION_ID = environ["SESSION_ID"]

TRACK_IDS = ["1oNYiuCvyixmwcyNZyq3Dd", "51vNSpNP76OEzvwVB7kIKT", "52wpFNuwZEr4Im7BSoo2vF"]  # fmt: skip
TRACK_URIS = [f"spotify:track:{t_id}" for t_id in TRACK_IDS]


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def client():
    cookies = {"session_id": SESSION_ID}
    async with ClientSession(
        base_url=BASE_URL, cookies=cookies, timeout=ClientTimeout(total=15)
    ) as session:
        yield session


@pytest.fixture(scope="session")
async def test_playlist(client: ClientSession):
    """Creates a playlist at the start of the session and deletes it at the end."""
    async with client.post("/playlists", json={"name": "pytest"}) as response:
        response.raise_for_status()
        playlist = await response.json()
        logger.info(f"Created test playlist: {playlist['name']}")

    yield playlist

    async with client.delete(f"/playlists/{playlist['id']}") as response:
        response.raise_for_status()
        logger.info(f"Deleted test playlist: {playlist['name']}")


class TestSpotify:
    @pytest.fixture(autouse=True)
    async def sleep_between_tests(self, request):
        yield
        if request.node.name == "test_add_playlist_tracks":
            logger.info("Sleeping so Spotify can sync...")
            await sleep(60)
        else:
            await sleep(2)

    async def test_get_playlists(self, client: ClientSession):
        async with client.get("/playlists") as response:
            response.raise_for_status()
            playlists = await response.json()
            assert isinstance(playlists, list)

    async def test_get_playlist(self, client: ClientSession, test_playlist: dict):
        async with client.get(f"/playlists/{test_playlist['id']}") as response:
            response.raise_for_status()
            playlist = await response.json()
            assert playlist["id"] == test_playlist["id"]

    async def test_get_playlist_tracks(
        self, client: ClientSession, test_playlist: dict
    ):
        async with client.get(f"/playlists/{test_playlist['id']}/tracks") as response:
            response.raise_for_status()
            tracks = await response.json()
            assert isinstance(tracks, list)

    async def test_add_playlist_tracks(
        self, client: ClientSession, test_playlist: dict
    ):
        async with client.post(
            f"/playlists/{test_playlist['id']}/tracks",
            json={"track_uris": TRACK_URIS},
        ) as response:
            response.raise_for_status()

        async with client.get(f"/playlists/{test_playlist['id']}/tracks") as response:
            response.raise_for_status()
            tracks = await response.json()
            track_uris = [t["track"]["uri"] for t in tracks]
            assert all(uri in track_uris for uri in TRACK_URIS)

    async def test_remove_playlist_tracks(
        self, client: ClientSession, test_playlist: dict
    ):
        async with client.delete(
            f"/playlists/{test_playlist['id']}/tracks",
            json={"track_uris": TRACK_URIS},
        ) as response:
            response.raise_for_status()

        async with client.get(f"/playlists/{test_playlist['id']}/tracks") as response:
            response.raise_for_status()
            tracks = await response.json()
            track_uris = [t["track"]["uri"] for t in tracks]
            assert all(uri not in track_uris for uri in TRACK_URIS)
