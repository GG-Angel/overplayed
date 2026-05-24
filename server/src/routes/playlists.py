from pydantic import BaseModel, Field
from spotipy import SpotifyException
from typing import List, Literal, Annotated
from dependencies import get_spotify_service
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from services import SpotifyService, PlaylistNotOwnedError
from limiter import limiter
from models import (
    Playlist,
    PlaylistItems,
    SpotifyIdPattern,
    SpotifyUriPattern,
)

PLAYLIST_ITEMS_PAGE_LIMIT = 100


class PlaylistItemsRequest(BaseModel):
    uris: List[Annotated[str, Field(pattern=SpotifyUriPattern)]] = Field(min_length=1)


router = APIRouter()


@router.get("/")
@limiter.limit("30/minute")
async def handle_get_playlists(
    request: Request,
    service: SpotifyService = Depends(get_spotify_service),
) -> List[Playlist]:
    playlists = await service.get_user_playlists()
    playlists.sort(key=lambda p: p.tracks.total, reverse=True)
    return playlists


@router.post("/")
@limiter.limit("20/minute")
async def handle_create_playlist(
    request: Request,
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    try:
        return await service.create_playlist()
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to create playlist.")


@router.get("/{playlist_id}")
@limiter.limit("60/minute")
async def handle_get_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    try:
        return await service.get_playlist(playlist_id)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to get playlist.")


@router.delete("/{playlist_id}")
@limiter.limit("20/minute")
async def handle_delete_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        await service.delete_playlist(playlist_id)
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to delete playlist.")


@router.get("/{playlist_id}/items")
@limiter.limit("60/minute")
async def handle_get_playlist_items(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
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
@limiter.limit("30/minute")
async def handle_update_playlist_items(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    action: Literal["add", "remove"],
    body: PlaylistItemsRequest,
    service: SpotifyService = Depends(get_spotify_service),
) -> None:
    try:
        match action:
            case "add":
                await service.add_playlist_items(playlist_id, body.uris)
            case "remove":
                await service.delete_playlist_items(playlist_id, body.uris)
    except PlaylistNotOwnedError:
        raise HTTPException(status_code=403, detail="Forbidden.")
    except SpotifyException:
        raise HTTPException(status_code=500, detail="Failed to update items.")
