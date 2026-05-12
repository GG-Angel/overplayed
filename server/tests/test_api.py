"""
Integration tests for API endpoints :)
- Requires SESSION_ID cookie from a logged-in Spotify session.
- Run `SESSION_ID=<your_session_id> uv run pytest tests/ -v`
"""

import pytest
from aiohttp import ClientSession, ClientResponseError
from conftest import BASE_URL, TEST_PLAYLIST_ITEM_URIS


async def get_json(client: ClientSession, path: str, **kwargs):
    async with client.get(path, **kwargs) as response:
        response.raise_for_status()
        return await response.json()


@pytest.mark.parametrize("run", ["miss", "hit"])
class TestAPI:
    @pytest.mark.parametrize("cookies", [None, {"session_id": ""}])
    async def test_login_required(self, run: str, cookies: dict | None):
        async with ClientSession(base_url=BASE_URL) as anon:
            async with anon.get("/users/me", cookies=cookies) as response:
                assert response.status == 401

    async def test_get_user(self, client: ClientSession, run: str):
        user = await get_json(client, "/users/me")
        assert isinstance(user, dict)

    async def test_get_playlists(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        playlists = await get_json(client, "/playlists")
        assert isinstance(playlists, list)

    async def test_get_playlist(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.get("/playlists/123") as response:
            with pytest.raises(ClientResponseError):
                response.raise_for_status()

        playlist = await get_json(client, f"/playlists/{test_playlist['id']}")
        assert playlist["id"] == test_playlist["id"]

    @pytest.mark.parametrize("page,expected_len", [(0, 3), (1, 0)])
    async def test_get_playlist_items(
        self,
        client: ClientSession,
        test_playlist: dict,
        run: str,
        page: int,
        expected_len: int,
    ):
        result = await get_json(
            client, f"/playlists/{test_playlist['id']}/items?page={page}"
        )
        assert isinstance(result, dict)
        assert isinstance(result.get("items"), list)
        assert len(result["items"]) == expected_len

    async def test_get_track_preview(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        result = await get_json(client, f"/playlists/{test_playlist['id']}/items")
        assert isinstance(result, dict)
        assert isinstance(result.get("items"), list)

        for item in result["items"]:
            isrc = item["track"]["external_ids"]["isrc"]
            preview = await get_json(client, f"/previews/{isrc}")
            assert isinstance(preview, dict)
            assert preview.get("preview_url") not in (None, "NO_PREVIEW")

    async def test_track_preview_not_found(self, client: ClientSession, run: str):
        async with client.get("/previews/123") as response:
            assert response.status == 404


async def test_add_playlist_items(client: ClientSession, empty_playlist: dict):
    async with client.post(
        f"/playlists/{empty_playlist['id']}/items",
        json={"item_uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()

    result = await get_json(client, f"/playlists/{empty_playlist['id']}/items")
    item_uris = [item["track"]["uri"] for item in result["items"]]
    assert all(uri in item_uris for uri in TEST_PLAYLIST_ITEM_URIS)


async def test_remove_playlist_items(client: ClientSession, empty_playlist: dict):
    async with client.post(
        f"/playlists/{empty_playlist['id']}/items",
        json={"item_uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()

    async with client.delete(
        f"/playlists/{empty_playlist['id']}/items",
        json={"item_uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()
