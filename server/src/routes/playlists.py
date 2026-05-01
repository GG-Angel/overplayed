from typing import List
from models import SpotifyPlaylist
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends
from services.spotify import SpotifyService

router = APIRouter()


@router.get("/")
async def handle_get_playlists(
    service: SpotifyService = Depends(get_spotify_service),
) -> List[SpotifyPlaylist]:
    return await service.get_playlists()


@router.get("/{playlist_id}")
async def handle_get_playlist(
    playlist_id: str,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylist:
    return await service.get_playlist(playlist_id=playlist_id)


# TODO
# @router.get("/{playlist_id}/tracks")
# async def handle_get_playlist_tracks(
#     playlist_id: str,
#     service: SpotifyService = Depends(get_spotify_service),
# ) -> List[SpotifyPlaylistTrack]:
#     return await service.get_playlist_tracks(playlist_id)
