from os import environ
from aiohttp import ClientSession, ClientTimeout
import pytest
import logging
from loguru import logger


BASE_URL = "http://127.0.0.1:8080"
SESSION_ID = environ["SESSION_ID"]


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
    """Creates a playlist at the start of the session and deletes it at the end."""
    async with client.post("/playlists", json={"name": "pytest"}) as response:
        response.raise_for_status()
        playlist = await response.json()
        logger.info(f"Created test playlist: {playlist['name']}")

    yield playlist

    async with client.delete(f"/playlists/{playlist['id']}") as response:
        response.raise_for_status()
        logger.info(f"Deleted test playlist: {playlist['name']}")
