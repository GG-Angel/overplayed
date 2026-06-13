from typing import List, Annotated
from fastapi import Request, Depends, APIRouter, Path, Query, BackgroundTasks
from core.limiter import limiter
from api.services.metrics.service import get_metric_service, MetricService, SwipeSession
from api.services.spotify.dependencies import get_spotify_service
from api.services.spotify.service import SpotifyService
from api.services.spotify.utils import get_formatted_date
from api.services.spotify.models import (
    Playlist,
    PlaylistItems,
    SpotifyIdPattern,
    SwipesForm,
    SwipesResponse,
)

router = APIRouter()


@router.get("/")
@limiter.limit("30/minute")
async def handle_get_playlists(
    request: Request,
    spotify: SpotifyService = Depends(get_spotify_service),
) -> List[Playlist]:
    return await spotify.get_user_playlists()


@router.get("/{playlist_id}")
@limiter.limit("60/minute")
async def handle_get_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    spotify: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    return await spotify.get_user_playlist(playlist_id)


@router.get("/{playlist_id}/items")
@limiter.limit("30/minute")
async def handle_get_playlist_items(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    page: int = Query(1, ge=1),
    spotify: SpotifyService = Depends(get_spotify_service),
) -> PlaylistItems:
    return await spotify.get_playlist_items(
        playlist_id,
        offset=(page - 1) * 100,
        limit=100,  # page size
    )


@router.post("/{playlist_id}/swipes")
@limiter.limit("10/minute")
async def handle_swipes(
    request: Request,
    background_tasks: BackgroundTasks,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    form: SwipesForm,
    spotify: SpotifyService = Depends(get_spotify_service),
    metrics: MetricService = Depends(get_metric_service),
) -> SwipesResponse:
    source_playlist = await spotify.get_user_playlist(playlist_id)

    backup_playlist = None
    if form.options.backup_enabled:
        backup_playlist = await spotify.create_playlist(
            f"Overplayed / {source_playlist.name}",
            f"Generated on {get_formatted_date()}",
        )
        await spotify.add_playlist_items(backup_playlist.id, form.uris)

    await spotify.delete_playlist_items(source_playlist.id, form.uris)

    # TODO: use new playlist length to check against tracks cut, may need to wait for it to refresh
    background_tasks.add_task(
        metrics.record_swipe_session,
        SwipeSession(
            user_id=spotify.user_id,
            playlist_id=source_playlist.id,
            snapshot_id=source_playlist.snapshot_id,
            total_tracks=source_playlist.tracks.total,
            tracks_swiped=len(form.uris),  # TODO: actually send this metric
            tracks_cut=len(form.uris),
        ),
    )

    return SwipesResponse(backup_playlist=backup_playlist)
