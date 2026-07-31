from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Path, Query, Request

from core.limiter import limiter
from routes.schemas import PlaylistPageResponse, PlaylistResponse, SwipesResponse
from services.spotify.dependencies import get_spotify_service
from services.spotify.models import Playlist, PlaylistIdRegex, PlaylistPage
from services.spotify.service import SpotifyService
from services.swipe.dependencies import get_swipe_service
from services.swipe.models import SwipesForm
from services.swipe.service import SwipeService

router = APIRouter()


@router.get("", response_model=list[PlaylistResponse])
@limiter.limit("30/minute")
async def handle_get_user_playlists(
    request: Request,
    spotify: SpotifyService = Depends(get_spotify_service),
) -> list[Playlist]:
    return await spotify.get_user_playlists()


@router.get("/{playlist_id}", response_model=PlaylistResponse)
@limiter.limit("60/minute")
async def handle_get_user_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    spotify: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    return await spotify.get_playlist(playlist_id)


@router.get("/{playlist_id}/tracks", response_model=PlaylistPageResponse)
@limiter.limit("30/minute")
async def handle_get_playlist_tracks(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    offset: int = Query(0, ge=0),
    spotify: SpotifyService = Depends(get_spotify_service),
) -> PlaylistPage:
    return await spotify.get_playlist_tracks(playlist_id, offset=offset)


@router.post("/{playlist_id}/swipes")
@limiter.limit("10/minute")
async def handle_swipes(
    request: Request,
    background_tasks: BackgroundTasks,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    form: SwipesForm,
    swipe: SwipeService = Depends(get_swipe_service),
) -> SwipesResponse:
    backup = await swipe.apply_swipes(playlist_id, form, background_tasks)
    return SwipesResponse(backup_playlist=backup)
