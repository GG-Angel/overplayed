"""
Integration tests for API endpoints :)
- Requires SESSION_ID cookie from a logged-in Spotify session.
- Run `SESSION_ID=<your_session_id> uv run pytest tests/ -v`
"""

import pytest
from aiohttp import ClientSession, ClientResponseError
from conftest import BASE_URL


TRACK_IDS = ["1oNYiuCvyixmwcyNZyq3Dd", "51vNSpNP76OEzvwVB7kIKT", "52wpFNuwZEr4Im7BSoo2vF"]  # fmt: skip
TRACK_URIS = [f"spotify:track:{t_id}" for t_id in TRACK_IDS]


class TestAPI:
    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_login_required(self, run: str):
        async with ClientSession(base_url=BASE_URL) as anon:
            async with anon.get("/users/me", cookies=None) as response:
                assert response.status == 422
            async with anon.get("/users/me", cookies={"session_id": ""}) as response:
                assert response.status == 401

    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_get_user(self, client: ClientSession, run: str):
        async with client.get("/users/me") as response:
            response.raise_for_status()
            user = await response.json()
            assert isinstance(user, dict)

    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_get_playlists(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.get("/playlists") as response:
            response.raise_for_status()
            playlists = await response.json()
            assert isinstance(playlists, list)

    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_get_playlist(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.get("/playlists/123") as response:
            with pytest.raises(ClientResponseError):
                response.raise_for_status()

        async with client.get(f"/playlists/{test_playlist['id']}") as response:
            response.raise_for_status()
            playlist = await response.json()
            assert playlist["id"] == test_playlist["id"]

    @pytest.mark.parametrize("run", ["once"])
    async def test_add_playlist_tracks(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.post(
            f"/playlists/{test_playlist['id']}/tracks",
            json={"track_uris": TRACK_URIS},
        ) as response:
            response.raise_for_status()

        async with client.get(f"/playlists/{test_playlist['id']}/tracks") as response:
            response.raise_for_status()
            tracks = await response.json()
            track_uris = [t["track"]["uri"] for t in tracks]
            assert all(uri in track_uris for uri in TRACK_URIS)

    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_get_playlist_tracks(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.get(f"/playlists/{test_playlist['id']}/tracks") as response:
            response.raise_for_status()
            tracks = await response.json()
            assert isinstance(tracks, list)
            assert len(tracks) == 3

        async with client.get(
            f"/playlists/{test_playlist['id']}/tracks?offset=1&limit=1"
        ) as response:
            response.raise_for_status()
            tracks = await response.json()
            assert isinstance(tracks, list)
            assert len(tracks) == 1

    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_get_track_preview(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.get(f"/playlists/{test_playlist['id']}/tracks") as response:
            response.raise_for_status()
            tracks = await response.json()
            assert isinstance(tracks, list)
            assert len(tracks) >= 1

        for track in tracks[:3]:
            isrc = track["track"]["external_ids"]["isrc"]
            async with client.get(f"/previews/{isrc}") as response:
                response.raise_for_status()
                preview = await response.json()
                assert isinstance(preview, dict)
                assert "preview" in preview and preview.get("preview") != "NO_PREVIEW"

    @pytest.mark.parametrize("run", ["miss", "hit"])
    async def test_track_preview_not_found(self, client: ClientSession, run: str):
        async with client.get("/previews/123") as response:
            assert response.status == 404

    @pytest.mark.parametrize("run", ["once"])
    async def test_remove_playlist_tracks(
        self, client: ClientSession, test_playlist: dict, run: str
    ):
        async with client.delete(
            f"/playlists/{test_playlist['id']}/tracks",
            json={"track_uris": TRACK_URIS},
        ) as response:
            response.raise_for_status()
