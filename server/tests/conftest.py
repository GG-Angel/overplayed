from os import environ
from aiohttp import ClientSession, ClientTimeout
import pytest
import logging
from loguru import logger


BASE_URL = "http://127.0.0.1:8080"
SESSION_ID = environ["SESSION_ID"]

TEST_PLAYLIST_ITEM_IDS = ["1oNYiuCvyixmwcyNZyq3Dd", "51vNSpNP76OEzvwVB7kIKT", "52wpFNuwZEr4Im7BSoo2vF"]  # fmt: skip
TEST_PLAYLIST_ITEM_URIS = [f"spotify:track:{t_id}" for t_id in TEST_PLAYLIST_ITEM_IDS]


class _PropagateHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        logging.getLogger(record.name).handle(record)


logger.remove()
logger.add(_PropagateHandler(), format="{message}")


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
    """Session-scoped playlist pre-populated with items, for read tests."""
    async with client.post("/playlists") as response:
        response.raise_for_status()
        playlist = await response.json()
        logger.info(f"Created test playlist: {playlist['name']}")

    async with client.post(
        f"/playlists/{playlist['id']}/items?action=add",
        json={"uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()

    yield playlist

    async with client.delete(f"/playlists/{playlist['id']}") as response:
        response.raise_for_status()
        logger.info(f"Deleted test playlist: {playlist['name']}")


@pytest.fixture
async def empty_playlist(client: ClientSession):
    """Function-scoped empty playlist, for mutation tests."""
    async with client.post("/playlists") as response:
        response.raise_for_status()
        playlist = await response.json()

    yield playlist

    async with client.delete(f"/playlists/{playlist['id']}") as response:
        response.raise_for_status()
