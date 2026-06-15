from fastapi import status
from aiohttp import ClientSession


async def test_get_preview_found(session: ClientSession):
    async with session.get("/previews/QZZ7U2566281") as response:
        assert response.status == status.HTTP_200_OK
        preview = await response.json()
        assert isinstance(preview, dict)
        assert preview.get("url") is not None


async def test_get_preview_not_found(session: ClientSession):
    async with session.get("/previews/USOCT0500070") as response:
        assert response.status == status.HTTP_200_OK
        preview = await response.json()
        assert isinstance(preview, dict)
        assert preview.get("url") is None
