from aiohttp import ClientSession
from fastapi import status


async def test_get_global_swipe_metrics(session: ClientSession):
    async with session.get("/metrics") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), dict)


async def test_get_user_swipe_metrics(session: ClientSession):
    async with session.get("/metrics/me") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), dict)


async def test_get_swipe_leaderboard(session: ClientSession):
    async with session.get("/users/leaderboard") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), list)
