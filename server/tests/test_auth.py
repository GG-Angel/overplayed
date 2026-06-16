from tests.conftest import BASE_URL
from fastapi import status
from aiohttp import ClientSession


async def test_login_redirect(session: ClientSession):
    async with session.get("/auth/login") as response:
        assert response.status == status.HTTP_200_OK


async def test_login_redirect_allowed(session: ClientSession):
    async with session.get(
        "/auth/login", params={"redirect_to": "/dashboard"}
    ) as response:
        assert response.status == status.HTTP_200_OK


async def test_login_redirect_malformed(session: ClientSession):
    async with session.get(
        "/auth/login", params={"redirect_to": "dashboard"}
    ) as response:
        assert response.status == status.HTTP_400_BAD_REQUEST


async def test_login_redirect_rejected(session: ClientSession):
    async with session.get(
        "/auth/login", params={"redirect_to": "https://evil.example.com"}
    ) as response:
        assert response.status == status.HTTP_400_BAD_REQUEST


async def test_unauthorized():
    async with ClientSession(base_url=BASE_URL) as anon:
        async with anon.get("/users/me") as response:
            assert response.status == status.HTTP_401_UNAUTHORIZED


async def test_authorized(session: ClientSession):
    async with session.get("/users/me") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), dict)
