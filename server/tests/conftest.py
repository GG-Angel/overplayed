import os
from aiohttp import ClientSession, ClientTimeout
import pytest

BASE_URL = "http://127.0.0.1:8080"


@pytest.fixture()
async def session():
    cookies = {"session_id": os.environ["SESSION_ID"]}
    async with ClientSession(
        base_url=BASE_URL,
        cookies=cookies,
        timeout=ClientTimeout(total=15),
    ) as session:
        yield session
