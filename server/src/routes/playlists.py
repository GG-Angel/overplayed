from spotipy import SpotifyException
from typing import List, Annotated, Literal
from models import (
    Playlist,
    PlaylistItemsRequest,
    PlaylistItems,
)
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from services.spotify import SpotifyService, PlaylistNotOwnedError

PLAYLIST_ITEMS_PAGE_LIMIT = 100

ResourceId = Annotated[str, Path(pattern=r"^[0-9A-Za-z]{22}$")]

router = APIRouter()


@router.get("/")
async def handle_get_playlists(
    service: SpotifyService = Depends(get_spotify_service),
) -> List[Playlist]:
    playlists = await service.get_user_playlists()
    playlists.sort(key=lambda p: p.tracks.total, reverse=True)
    return playlists


@router.post("/")
async def handle_create_playlist(
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    try:
        return await service.create_playlist()
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to create playlist.")


@router.get("/{playlist_id}")
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


@router.delete("/{playlist_id}")
async def handle_delete_playlist(
    playlist_id: ResourceId, service: SpotifyService = Depends(get_spotify_service)
) -> None:
    try:
        await service.delete_playlist(playlist_id)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to delete playlist.")


@router.get("/{playlist_id}/items")
async def handle_get_playlist_items(
    playlist_id: ResourceId,
    page: int = Query(0, ge=0),
    service: SpotifyService = Depends(get_spotify_service),
) -> PlaylistItems:
    try:
        return await service.get_playlist_items(
            playlist_id,
            offset=page * PLAYLIST_ITEMS_PAGE_LIMIT,
            limit=PLAYLIST_ITEMS_PAGE_LIMIT,
        )
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get items.")


@router.post("/{playlist_id}/items")
async def handle_update_playlist_items(
    playlist_id: ResourceId,
    action: Literal["add", "remove"],
    body: PlaylistItemsRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        match action:
            case "remove":
                await service.delete_playlist_items(playlist_id, body.uris)
            case "add":
                await service.add_playlist_items(playlist_id, body.uris)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to update items.")
