import spotipy

from app.dependencies import parse_time, require

time_default = "1970-01-01T00:00:00Z"


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


def fetch_playlist_items(client: spotipy.Spotify, playlist_id: str) -> list[dict]:
    all_items = []
    offset = 0
    limit = 100
    while True:
        response = require(
            client.playlist_items(playlist_id=playlist_id, limit=limit, offset=offset),
            f"Failed to fetch playlist tracks: {playlist_id}",
        )
        items = response["items"]
        all_items.extend(items)

        if len(items) < limit:
            break
        offset += limit

    return all_items


def fetch_filtered_playlist_items(
    client: spotipy.Spotify, playlist_id: str
) -> list[dict]:
    filtered_items = {}
    items = fetch_playlist_items(client, playlist_id)
    for item in items:
        track_id = require(item.get("track", {}).get("id"), "Failed to get track id")
        if track_id not in filtered_items:
            filtered_items[track_id] = item
            continue

        curr_added_at = parse_time(item.get("added_at", time_default))
        prev_added_at = parse_time(
            filtered_items[track_id].get("added_at", time_default)
        )
        if curr_added_at > prev_added_at:
            filtered_items[track_id] = item

    return list(filtered_items.values())
