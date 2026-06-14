from fastapi import status
from aiohttp import ClientSession


async def test_get_preview_found(session: ClientSession):
    async with session.get("/previews/QZZ7U2566281") as response:
        assert response.status == status.HTTP_200_OK
        playlists = await response.json()
        assert isinstance(playlists, dict)


async def test_get_preview_not_found(session: ClientSession):
    async with session.get("/previews/USOCT0500070") as response:
        assert response.status == status.HTTP_404_NOT_FOUND
