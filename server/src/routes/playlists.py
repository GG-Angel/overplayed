from database.schemas import SwipeSession, User
from database.service import DatabaseService, get_database_service
from core.exceptions import BadRequestException
from typing import List, Annotated
from fastapi import Request, Depends, APIRouter, Path, Query, BackgroundTasks
from core.limiter import limiter
from services.spotify.dependencies import get_spotify_service
from services.spotify.service import SpotifyService
from services.spotify.utils import get_formatted_date
from services.spotify.models import (
    Playlist,
    PlaylistPage,
    SwipesForm,
    SwipesResponse,
    PlaylistIdRegex,
)

router = APIRouter()


@router.get("/")
@limiter.limit("30/minute")
async def handle_get_user_playlists(
    request: Request,
    spotify: SpotifyService = Depends(get_spotify_service),
) -> List[Playlist]:
    return await spotify.get_user_playlists()


@router.get("/{playlist_id}")
@limiter.limit("60/minute")
async def handle_get_user_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    spotify: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    return await spotify.get_playlist(playlist_id)


@router.get("/{playlist_id}/items")
@limiter.limit("30/minute")
async def handle_get_playlist_items(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    offset: int = Query(0, ge=0),
    spotify: SpotifyService = Depends(get_spotify_service),
) -> PlaylistPage:
    return await spotify.get_playlist_items(playlist_id, offset=offset)


@router.post("/{playlist_id}/swipes")
@limiter.limit("10/minute")
async def handle_swipes(
    request: Request,
    background_tasks: BackgroundTasks,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    form: SwipesForm,
    spotify: SpotifyService = Depends(get_spotify_service),
    db: DatabaseService = Depends(get_database_service),
) -> SwipesResponse:
    user = await spotify.get_current_user()
    source = await spotify.get_playlist(playlist_id)

    if not (len(form.uris) <= form.tracks_swiped <= source.tracks.total):
        raise BadRequestException()

    backup = None
    if form.options.backup_enabled:
        backup = await spotify.create_playlist(
            f"Overplayed / {source.name}",
            f"Generated on {get_formatted_date()}",
        )
        await spotify.add_playlist_items(backup.id, form.uris)
    await spotify.delete_playlist_items(source.id, form.uris)

    # record user and session
    background_tasks.add_task(
        db.upsert_user,
        User(
            id=user.id,
            display_name=user.display_name,
            spotify_url=user.external_urls.spotify,
            picture_url=user.images[-1].url if user.images else None,
        ),
    )
    background_tasks.add_task(
        db.record_swipe_session,
        SwipeSession(
            user_id=spotify.user_id,
            playlist_id=source.id,
            snapshot_id=source.snapshot_id,
            total_tracks=source.tracks.total,
            tracks_swiped=form.tracks_swiped,
            tracks_cut=len(form.uris),
        ),
    )

    return SwipesResponse(backup_playlist=backup)
