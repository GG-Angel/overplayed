from spotipy import SpotifyException
from typing import List
from models import SpotifyPlaylist
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends, HTTPException
from services.spotify import SpotifyService

router = APIRouter()


@router.get("/")
async def handle_get_playlists(
    service: SpotifyService = Depends(get_spotify_service),
) -> List[SpotifyPlaylist]:
    return await service.get_user_playlists()


@router.get("/{playlist_id}")
async def handle_get_playlist(
    playlist_id: str,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylist:
    try:
        return await service.get_playlist(playlist_id=playlist_id)
    except SpotifyException:
        raise HTTPException(status_code=404, detail="Not found.")


# TODO
# @router.get("/{playlist_id}/tracks")
# async def handle_get_playlist_tracks(
#     playlist_id: str,
#     service: SpotifyService = Depends(get_spotify_service),
# ) -> List[SpotifyPlaylistTrack]:
#     return await service.get_playlist_tracks(playlist_id)
