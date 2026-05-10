from spotipy import SpotifyException
from typing import List, Annotated
from models import (
    SpotifyPlaylist,
    CreatePlaylistRequest,
    TrackUrisRequest,
    SpotifyPlaylistTracks,
)
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends, HTTPException, Path
from services.spotify import SpotifyService, PlaylistNotOwnedError


router = APIRouter()


SpotifyID = Annotated[str, Path(pattern=r"^[0-9A-Za-z]{22}$")]


@router.get("/", status_code=200)
async def handle_get_playlists(
    service: SpotifyService = Depends(get_spotify_service),
) -> List[SpotifyPlaylist]:
    return await service.get_user_playlists()


@router.post("/", status_code=201)
async def handle_create_playlist(
    body: CreatePlaylistRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylist:
    try:
        return await service.create_playlist(body.name, body.description)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to create playlist.")


@router.get("/{playlist_id}", status_code=200)
async def handle_get_playlist(
    playlist_id: SpotifyID,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylist:
    try:
        return await service.get_playlist(playlist_id)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get playlist.")


@router.delete("/{playlist_id}", status_code=200)
async def handle_delete_playlist(
    playlist_id: SpotifyID, service: SpotifyService = Depends(get_spotify_service)
) -> None:
    try:
        await service.delete_playlist(playlist_id)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to add tracks.")


@router.get("/{playlist_id}/tracks", status_code=200)
async def handle_get_playlist_tracks(
    playlist_id: SpotifyID,
    offset: int = 0,
    limit: int = 100,
    service: SpotifyService = Depends(get_spotify_service),
) -> SpotifyPlaylistTracks:
    try:
        return await service.get_playlist_tracks(
            playlist_id, offset=offset, limit=limit
        )
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get tracks.")


@router.post("/{playlist_id}/tracks", status_code=204)
async def handle_add_playlist_tracks(
    playlist_id: SpotifyID,
    body: TrackUrisRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.add_playlist_tracks(playlist_id, body.track_uris)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to add tracks.")


@router.delete("/{playlist_id}/tracks", status_code=204)
async def handle_delete_playlist_tracks(
    playlist_id: SpotifyID,
    body: TrackUrisRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.delete_playlist_tracks(playlist_id, body.track_uris)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to remove tracks.")
