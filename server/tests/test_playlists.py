import pytest
from fastapi import status
from aiohttp import ClientSession


@pytest.fixture()
async def first_playlist_id(session: ClientSession) -> str:
    async with session.get("/playlists") as response:
        assert response.status == status.HTTP_200_OK
        playlists = await response.json()
        assert isinstance(playlists, list)

    if len(playlists) == 0:
        pytest.skip("No playlists found")

    return playlists[0]["id"]


async def test_get_playlists(session: ClientSession):
    async with session.get("/playlists") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), list)


async def test_get_playlist(session: ClientSession, first_playlist_id: str):
    async with session.get(f"/playlists/{first_playlist_id}") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), dict)


async def test_get_playlist_items(session: ClientSession, first_playlist_id: str):
    async with session.get(f"/playlists/{first_playlist_id}/items") as response:
        assert response.status == status.HTTP_200_OK
        page = await response.json()
        assert isinstance(page, dict)
        assert isinstance(page.get("items"), list)
