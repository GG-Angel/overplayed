from aiohttp import ClientSession
from fastapi import status


async def test_get_global_swipe_metrics(session: ClientSession):
    async with session.get("/metrics") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), dict)
