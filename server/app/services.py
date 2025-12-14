import spotipy

from app.dependencies import require


def fetch_playlists(client: spotipy.Spotify) -> list[dict]:
    all_playlists = []
    offset = 0
    limit = 50
    while True:
        response = require(
            client.current_user_playlists(limit=limit, offset=offset),
            "Failed to fetch playlists",
        )
        playlists = response["items"]
        all_playlists.extend(playlists)

        if len(playlists) < limit:
            break
        offset += limit

    return all_playlists


def _is_playlist_editable(playlist: dict, user_id: str) -> bool:
    is_owner = playlist.get("owner", {}).get("id") == user_id
    is_collaborative = playlist.get("collaborative", False)
    return is_owner or is_collaborative


def fetch_editable_playlists(client: spotipy.Spotify) -> list[dict]:
    user = require(client.me(), "Failed to fetch current user")
    playlists = fetch_playlists(client)
    return list(filter(lambda p: _is_playlist_editable(p, user["id"]), playlists))


def fetch_playlist_tracks(client: spotipy.Spotify, playlist_id: str) -> dict:
    all_tracks = []
    offset = 0
    limit = 100
    while True:
        response = require(
            client.playlist_items(playlist_id=playlist_id, limit=limit, offset=offset),
            f"Failed to fetch playlist tracks: {playlist_id}",
        )
        tracks = response["items"]
        all_tracks.extend(tracks)

        if len(tracks) < limit:
            break
        offset += limit

    return tracks
