from tests.conftest import TEST_PLAYLIST_NAME
import pytest
from fastapi import status
from aiohttp import ClientSession


@pytest.fixture()
async def playlists(session: ClientSession) -> list:
    async with session.get("/playlists") as response:
        assert response.status == status.HTTP_200_OK
        result = await response.json()
        assert isinstance(result, list)
    return result


@pytest.fixture()
def first_playlist_id(playlists: list) -> str:
    if len(playlists) == 0:
        pytest.skip("No playlists found")
    return playlists[0]["id"]


@pytest.fixture()
def testing_playlist_id(playlists: list) -> str:
    playlist = next((p for p in playlists if p["name"] == TEST_PLAYLIST_NAME), None)
    if playlist is None:
        pytest.skip(f"No '{TEST_PLAYLIST_NAME}' playlist found")
    return playlist["id"]


async def get_playlist_items(session: ClientSession, playlist_id: str) -> list:
    async with session.get(f"/playlists/{playlist_id}/items") as response:
        assert response.status == status.HTTP_200_OK
        page = await response.json()
        assert isinstance(page, dict)
        assert isinstance(page.get("items"), list)
    return page["items"]


async def test_get_playlists(session: ClientSession):
    async with session.get("/playlists") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), list)


async def test_get_playlist(session: ClientSession, first_playlist_id: str):
    async with session.get(f"/playlists/{first_playlist_id}") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), dict)


async def test_get_playlist_items(session: ClientSession, first_playlist_id: str):
    await get_playlist_items(session, first_playlist_id)


async def test_submit_swipes(session: ClientSession, testing_playlist_id: str):
    items = await get_playlist_items(session, testing_playlist_id)

    track_uris = [item["track"]["uri"] for item in items]
    if len(track_uris) < 3:
        pytest.skip("Test playlist must have at least 3 tracks")

    async with session.post(
        f"/playlists/{testing_playlist_id}/swipes",
        json={"options": {"backup_enabled": True}, "uris": track_uris[:3]},
    ) as response:
        assert response.status == status.HTTP_200_OK
        result = await response.json()
        assert isinstance(result, dict)
        assert result["backup_playlist"] is not None
