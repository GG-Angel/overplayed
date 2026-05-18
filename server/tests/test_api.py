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


class TestInputValidation:
    @pytest.mark.parametrize(
        "playlist_id",
        [
            "123",  # too short
            "a" * 21,  # one char short
            "a" * 23,  # one char over
            "!" * 22,  # invalid characters
            "abc-defghijklmnopqrstu",  # hyphen not allowed
            " " * 22,  # whitespace
        ],
    )
    async def test_get_playlist_invalid_id(
        self, client: ClientSession, playlist_id: str
    ):
        async with client.get(f"/playlists/{playlist_id}") as response:
            assert response.status == 422

    @pytest.mark.parametrize("playlist_id", ["123", "a" * 23, "!" * 22])
    async def test_delete_playlist_invalid_id(
        self, client: ClientSession, playlist_id: str
    ):
        async with client.delete(f"/playlists/{playlist_id}") as response:
            assert response.status == 422

    @pytest.mark.parametrize("page", [-1, -100, "abc", "1.5"])
    async def test_get_playlist_items_invalid_page(
        self, client: ClientSession, test_playlist: dict, page
    ):
        async with client.get(
            f"/playlists/{test_playlist['id']}/items?page={page}"
        ) as response:
            assert response.status == 422

    async def test_get_playlist_items_invalid_id(self, client: ClientSession):
        async with client.get("/playlists/bad-id/items") as response:
            assert response.status == 422

    @pytest.mark.parametrize("action", ["add", "remove"])
    @pytest.mark.parametrize(
        "body",
        [
            {},  # missing uris
            {"uris": []},  # empty list
            {"uris": ["not-a-uri"]},
            {"uris": ["spotify:track:short"]},
            {"uris": ["spotify:album:1oNYiuCvyixmwcyNZyq3Dd"]},  # wrong type
            {"uris": ["spotify:track:1oNYiuCvyixmwcyNZyq3D!"]},  # bad char
            {"uris": ["spotify:track:1oNYiuCvyixmwcyNZyq3Dd", "bad"]},  # one bad
            {"uris": "spotify:track:1oNYiuCvyixmwcyNZyq3Dd"},  # not a list
        ],
    )
    async def test_update_playlist_items_invalid_body(
        self, client: ClientSession, empty_playlist: dict, action: str, body: dict
    ):
        async with client.post(
            f"/playlists/{empty_playlist['id']}/items?action={action}", json=body
        ) as response:
            assert response.status == 422

    @pytest.mark.parametrize("action", ["", "delete", "ADD", "foo"])
    async def test_update_playlist_items_invalid_action(
        self, client: ClientSession, empty_playlist: dict, action: str
    ):
        async with client.post(
            f"/playlists/{empty_playlist['id']}/items?action={action}",
            json={"uris": ["spotify:track:1oNYiuCvyixmwcyNZyq3Dd"]},
        ) as response:
            assert response.status == 422

    async def test_update_playlist_items_missing_action(
        self, client: ClientSession, empty_playlist: dict
    ):
        async with client.post(
            f"/playlists/{empty_playlist['id']}/items",
            json={"uris": ["spotify:track:1oNYiuCvyixmwcyNZyq3Dd"]},
        ) as response:
            assert response.status == 422

    @pytest.mark.parametrize(
        "isrc",
        [
            "123",  # too short
            "USRC1234567",  # one char short
            "USRC172607810",  # one char over
            "1234567890AB",  # wrong shape
            "US-RC17260781",  # invalid character
            "USRC1726078A",  # letter where digit required
        ],
    )
    async def test_get_track_preview_invalid_isrc(
        self, client: ClientSession, isrc: str
    ):
        async with client.get(f"/previews/{isrc}") as response:
            assert response.status == 422


async def test_add_playlist_items(client: ClientSession, empty_playlist: dict):
    async with client.post(
        f"/playlists/{empty_playlist['id']}/items?action=add",
        json={"uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()

    result = await get_json(client, f"/playlists/{empty_playlist['id']}/items")
    item_uris = [item["track"]["uri"] for item in result["items"]]
    assert all(uri in item_uris for uri in TEST_PLAYLIST_ITEM_URIS)


async def test_remove_playlist_items(client: ClientSession, empty_playlist: dict):
    async with client.post(
        f"/playlists/{empty_playlist['id']}/items?action=add",
        json={"uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()

    async with client.post(
        f"/playlists/{empty_playlist['id']}/items?action=remove",
        json={"uris": TEST_PLAYLIST_ITEM_URIS},
    ) as response:
        response.raise_for_status()
