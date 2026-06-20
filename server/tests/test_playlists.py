import pytest
from fastapi import status
from aiohttp import ClientSession
from tests.conftest import BASE_URL, TEST_PLAYLIST_NAME, TEST_PLAYLIST_MIN_TRACKS

LIKED_SONGS_ID = "liked-songs"
FAKE_URI = "spotify:track:4iV5W9uYEdYUVa79Axb7Rh"
FAKE_URI_2 = "spotify:track:1301WleyT98MSxVHPZCA6M"


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


@pytest.fixture(params=["first_playlist_id", LIKED_SONGS_ID])
async def playlist_id(request, first_playlist_id):
    if request.param == "first_playlist_id":
        return first_playlist_id
    return request.param


@pytest.fixture()
def testing_playlist_id(playlists: list) -> str:
    playlist = next((p for p in playlists if p["name"] == TEST_PLAYLIST_NAME), None)
    if playlist is None:
        pytest.skip(f"No '{TEST_PLAYLIST_NAME}' playlist found")
    return playlist["id"]


async def get_playlist_tracks(session: ClientSession, playlist_id: str) -> list:
    async with session.get(f"/playlists/{playlist_id}/tracks") as response:
        assert response.status == status.HTTP_200_OK
        page = await response.json()
        assert isinstance(page, dict)
        assert isinstance(page.get("tracks"), list)
    return page["tracks"]


async def test_get_playlists(session: ClientSession):
    async with session.get("/playlists") as response:
        assert response.status == status.HTTP_200_OK
        assert isinstance(await response.json(), list)


async def test_get_playlist(session: ClientSession, playlist_id: str):
    async with session.get(f"/playlists/{playlist_id}") as response:
        assert response.status == status.HTTP_200_OK
        playlist = await response.json()
        assert isinstance(playlist, dict)
        assert playlist["id"] == playlist_id


async def test_get_playlist_tracks(session: ClientSession, playlist_id: str):
    await get_playlist_tracks(session, playlist_id)


async def test_submit_swipes(session: ClientSession, testing_playlist_id: str):
    tracks = await get_playlist_tracks(session, testing_playlist_id)
    track_uris = [track["uri"] for track in tracks][:TEST_PLAYLIST_MIN_TRACKS]
    if len(track_uris) < TEST_PLAYLIST_MIN_TRACKS:
        pytest.skip(f"Test playlist needs at least {TEST_PLAYLIST_MIN_TRACKS} tracks")

    async with session.post(
        f"/playlists/{testing_playlist_id}/swipes",
        json={
            "options": {"backup_enabled": True},
            "uris": track_uris,
            "tracks_swiped": len(track_uris),
        },
    ) as response:
        assert response.status == status.HTTP_200_OK
        result = await response.json()
        assert isinstance(result, dict)
        assert result["backup_playlist"] is not None


async def test_get_playlist_invalid_id(session: ClientSession):
    async with session.get("/playlists/not-a-valid-spotify-id") as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_get_playlist_not_found(session: ClientSession):
    async with session.get(f"/playlists/{'0' * 22}") as response:
        assert response.status == status.HTTP_404_NOT_FOUND


async def test_get_playlist_tracks_invalid_id(session: ClientSession):
    async with session.get("/playlists/not-a-valid-id/tracks") as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_get_playlist_tracks_negative_offset(
    session: ClientSession, first_playlist_id: str
):
    async with session.get(
        f"/playlists/{first_playlist_id}/tracks", params={"offset": -1}
    ) as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_submit_swipes_invalid_playlist_id(session: ClientSession):
    async with session.post(
        "/playlists/not-a-valid-id/swipes",
        json={
            "options": {"backup_enabled": False},
            "uris": [FAKE_URI],
            "tracks_swiped": 1,
        },
    ) as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_submit_swipes_empty_uris(session: ClientSession, first_playlist_id: str):
    async with session.post(
        f"/playlists/{first_playlist_id}/swipes",
        json={
            "options": {"backup_enabled": False},
            "uris": [],
            "tracks_swiped": 1,
        },
    ) as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_submit_swipes_malformed_uri(
    session: ClientSession, first_playlist_id: str
):
    async with session.post(
        f"/playlists/{first_playlist_id}/swipes",
        json={
            "options": {"backup_enabled": False},
            "uris": ["spotify:track:tooshort"],
            "tracks_swiped": 1,
        },
    ) as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_submit_swipes_non_positive_tracks_swiped(
    session: ClientSession, first_playlist_id: str
):
    async with session.post(
        f"/playlists/{first_playlist_id}/swipes",
        json={
            "options": {"backup_enabled": False},
            "uris": [FAKE_URI],
            "tracks_swiped": 0,
        },
    ) as response:
        assert response.status == status.HTTP_422_UNPROCESSABLE_CONTENT


async def test_submit_swipes_more_uris_than_swiped(
    session: ClientSession, first_playlist_id: str
):
    async with session.post(
        f"/playlists/{first_playlist_id}/swipes",
        json={
            "options": {"backup_enabled": False},
            "uris": [FAKE_URI, FAKE_URI_2],
            "tracks_swiped": 1,
        },
    ) as response:
        assert response.status == status.HTTP_400_BAD_REQUEST


async def test_submit_swipes_exceeds_playlist_total(
    session: ClientSession, first_playlist_id: str
):
    async with session.post(
        f"/playlists/{first_playlist_id}/swipes",
        json={
            "options": {"backup_enabled": False},
            "uris": [FAKE_URI],
            "tracks_swiped": 1_000_000_000,
        },
    ) as response:
        assert response.status == status.HTTP_400_BAD_REQUEST


async def test_submit_swipes_unauthorized(first_playlist_id: str):
    async with ClientSession(base_url=BASE_URL) as anon:
        async with anon.post(
            f"/playlists/{first_playlist_id}/swipes",
            json={
                "options": {"backup_enabled": False},
                "uris": [FAKE_URI],
                "tracks_swiped": 1,
            },
        ) as response:
            assert response.status == status.HTTP_401_UNAUTHORIZED
