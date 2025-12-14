import spotipy

from app.core.logger import logger
from app.dependencies import parse_time, require

time_default = "1970-01-01T00:00:00Z"


def fetch_playlists(client: spotipy.Spotify) -> list[dict]:
    logger.info("Fetching all playlists for the current user.")
    all_playlists = []
    offset = 0
    limit = 50
    while True:
        logger.debug(f"Fetching playlists with offset={offset} and limit={limit}.")
        response = require(
            client.current_user_playlists(limit=limit, offset=offset),
            "Failed to fetch playlists",
        )
        playlists = response["items"]
        all_playlists.extend(playlists)

        logger.debug(f"Fetched {len(playlists)} playlists.")
        if len(playlists) < limit:
            logger.info("All playlists have been fetched.")
            break
        offset += limit

    return all_playlists


def _is_playlist_editable(playlist: dict, user_id: str) -> bool:
    is_owner = playlist.get("owner", {}).get("id") == user_id
    is_collaborative = playlist.get("collaborative", False)
    return is_owner or is_collaborative


def fetch_editable_playlists(client: spotipy.Spotify) -> list[dict]:
    logger.info("Fetching editable playlists for the current user.")
    user_id = require(client.me(), "Failed to fetch current user")["id"]
    playlists = fetch_playlists(client)
    editable_playlists = list(
        filter(lambda p: _is_playlist_editable(p, user_id), playlists)
    )
    logger.info(f"Found {len(editable_playlists)} editable playlists.")
    return editable_playlists


def fetch_playlist_items(client: spotipy.Spotify, playlist_id: str) -> list[dict]:
    logger.info(f"Fetching items for playlist with ID: {playlist_id}.")
    all_items = []
    offset = 0
    limit = 100
    while True:
        logger.debug(f"Fetching playlist items with offset={offset} and limit={limit}.")
        response = require(
            client.playlist_items(playlist_id=playlist_id, limit=limit, offset=offset),
            f"Failed to fetch playlist tracks: {playlist_id}",
        )
        items = response["items"]
        all_items.extend(items)

        logger.debug(f"Fetched {len(items)} items from playlist {playlist_id}.")
        if len(items) < limit:
            logger.info(f"All items have been fetched for playlist {playlist_id}.")
            break
        offset += limit

    return all_items


def fetch_filtered_playlist_items(
    client: spotipy.Spotify, playlist_id: str
) -> list[dict]:
    logger.info(f"Fetching filtered items for playlist with ID: {playlist_id}.")
    filtered_items = {}
    items = fetch_playlist_items(client, playlist_id)
    logger.debug(f"Processing {len(items)} items to filter duplicates.")
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

    logger.info(f"Filtered items count: {len(filtered_items)}.")
    return list(filtered_items.values())
