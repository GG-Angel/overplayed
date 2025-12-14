import random
from typing import Optional
import spotipy
from fastapi import APIRouter, Depends, Query

from app.dependencies import get_spotify_client
from app.services import fetch_editable_playlists, fetch_unique_playlist_items


router = APIRouter()


@router.get("/")
def read_playlists(client: spotipy.Spotify = Depends(get_spotify_client)):
    return fetch_editable_playlists(client)


@router.get("/{playlist_id}")
def read_playlist_items(
    playlist_id: str,
    sort: Optional[str] = Query(None, description="Sorting method"),
    client: spotipy.Spotify = Depends(get_spotify_client),
):
    items = fetch_unique_playlist_items(client, playlist_id)
    if sort == "random":
        random.shuffle(items)
    return items
