from fastapi import APIRouter, Depends
import spotipy

from app.dependencies import get_spotify_client
from app.services import fetch_editable_playlists, fetch_unique_playlist_items


router = APIRouter()


@router.get("/")
def read_playlists(client: spotipy.Spotify = Depends(get_spotify_client)):
    return fetch_editable_playlists(client)


@router.get("/{playlist_id}")
def read_playlist(
    playlist_id: str, client: spotipy.Spotify = Depends(get_spotify_client)
):
    return fetch_unique_playlist_items(client, playlist_id)
