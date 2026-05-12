from spotipy import SpotifyException
from typing import List, Annotated
from models import (
    Playlist,
    CreatePlaylistRequest,
    ItemUrisRequest,
    PlaylistItems,
)
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends, HTTPException, Path
from services.spotify import SpotifyService, PlaylistNotOwnedError


router = APIRouter()


ResourceId = Annotated[str, Path(pattern=r"^[0-9A-Za-z]{22}$")]


@router.get("/", status_code=200)
async def handle_get_playlists(
    service: SpotifyService = Depends(get_spotify_service),
) -> List[Playlist]:
    return await service.get_user_playlists()


@router.post("/", status_code=201)
async def handle_create_playlist(
    body: CreatePlaylistRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    try:
        return await service.create_playlist(body.name, body.description)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to create playlist.")


@router.get("/{playlist_id}", status_code=200)
async def handle_get_playlist(
    playlist_id: ResourceId,
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    try:
        return await service.get_playlist(playlist_id)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get playlist.")


@router.delete("/{playlist_id}", status_code=200)
async def handle_delete_playlist(
    playlist_id: ResourceId, service: SpotifyService = Depends(get_spotify_service)
) -> None:
    try:
        await service.delete_playlist(playlist_id)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to delete playlist.")


@router.get("/{playlist_id}/items", status_code=200)
async def handle_get_playlist_items(
    playlist_id: ResourceId,
    page: int = 0,
    service: SpotifyService = Depends(get_spotify_service),
) -> PlaylistItems:
    try:
        limit = 100
        return await service.get_playlist_items(
            playlist_id, offset=page * limit, limit=limit
        )
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get items.")


@router.post("/{playlist_id}/items", status_code=204)
async def handle_add_playlist_items(
    playlist_id: ResourceId,
    body: ItemUrisRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.add_playlist_items(playlist_id, body.item_uris)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to add items.")


@router.delete("/{playlist_id}/items", status_code=204)
async def handle_delete_playlist_items(
    playlist_id: ResourceId,
    body: ItemUrisRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.delete_playlist_items(playlist_id, body.item_uris)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to remove items.")
