from spotipy import SpotifyException
from typing import List
from models import SpotifyPlaylist, SpotifyPlaylistTrack
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends, HTTPException
from services.spotify import SpotifyService, PlaylistNotOwnedError
from pydantic import BaseModel


class TrackUrisRequest(BaseModel):
    track_uris: List[str]


class CreatePlaylistRequest(BaseModel):
    name: str
    description: str = ""


router = APIRouter()


@router.get("/", status_code=200)
async def handle_get_playlists(
    service: SpotifyService = Depends(get_spotify_service),
) -> List[SpotifyPlaylist]:
    return await service.get_user_playlists()


@router.get("/{playlist_id}", status_code=200)
async def handle_get_playlist(
    playlist_id: str,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylist:
    try:
        return await service.get_playlist(playlist_id)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get playlist.")


@router.get("/{playlist_id}/tracks", status_code=200)
async def handle_get_playlist_tracks(
    playlist_id: str,
    offset: int = 0,
    limit: int = 100,
    service: SpotifyService = Depends(get_spotify_service),
) -> List[SpotifyPlaylistTrack]:
    try:
        return await service.get_playlist_tracks(
            playlist_id, offset=offset, limit=limit
        )
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get tracks.")


@router.delete("/{playlist_id}/tracks", status_code=204)
async def handle_delete_playlist_tracks(
    playlist_id: str,
    body: TrackUrisRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.delete_playlist_tracks(playlist_id, body.track_uris)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to remove tracks.")


@router.post("/", status_code=201)
async def handle_create_playlist(
    body: CreatePlaylistRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylist:
    try:
        return await service.create_playlist(body.name, body.description)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to create playlist.")


@router.post("/{playlist_id}/tracks", status_code=204)
async def handle_add_playlist_tracks(
    playlist_id: str,
    body: TrackUrisRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.add_playlist_tracks(playlist_id, body.track_uris)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to add tracks.")


@router.delete("/{playlist_id}", status_code=200)
async def handle_delete_playlist(
    playlist_id: str, service: SpotifyService = Depends(get_spotify_service)
) -> None:
    try:
        await service.delete_playlist(playlist_id)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to add tracks.")
