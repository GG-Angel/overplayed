from typing import List, Annotated
from fastapi import Request, Depends, APIRouter, Path, Query
from core.limiter import limiter
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
    service: SpotifyService = Depends(get_spotify_service),
) -> List[Playlist]:
    return await service.get_user_playlists()


@router.get("/{playlist_id}")
@limiter.limit("60/minute")
async def handle_get_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    return await service.get_user_playlist(playlist_id)


@router.get("/{playlist_id}/items")
@limiter.limit("30/minute")
async def handle_get_playlist_items(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    page: int = Query(1, ge=1),
    service: SpotifyService = Depends(get_spotify_service),
) -> PlaylistItems:
    return await service.get_playlist_items(
        playlist_id,
        offset=(page - 1) * 100,
        limit=100,  # page size
    )


@router.post("/{playlist_id}/swipes")
@limiter.limit("15/minute")
async def handle_swipes(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    form: SwipesForm,
    service: SpotifyService = Depends(get_spotify_service),
) -> SwipesResponse:
    source_playlist = await service.get_user_playlist(playlist_id)

    backup_playlist = None
    if form.options.backup_enabled:
        backup_playlist = await service.create_playlist(
            f"Overplayed - {source_playlist.name}",
            f"Generated on {get_formatted_date()}",
        )
        await service.add_playlist_items(backup_playlist.id, form.uris)

    await service.delete_playlist_items(source_playlist.id, form.uris)

    return SwipesResponse(backup_playlist=backup_playlist)


# @router.post("/")
# @limiter.limit("20/minute")
# async def handle_create_playlist(
#     request: Request,
#     service: SpotifyService = Depends(get_spotify_service),
# ) -> Playlist:
#     return await service.create_playlist()


# @router.delete("/{playlist_id}")
# @limiter.limit("20/minute")
# async def handle_delete_playlist(
#     request: Request,
#     playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
#     service: SpotifyService = Depends(get_spotify_service),
# ) -> None:
#     await service.delete_playlist(playlist_id)


# @router.post("/{playlist_id}/items")
# @limiter.limit("30/minute")
# async def handle_update_playlist_items(
#     request: Request,
#     playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
#     action: PlaylistUpdateAction,
#     body: PlaylistItemsRequest,
#     service: SpotifyService = Depends(get_spotify_service),
# ) -> None:
#     try:
#         match action:
#             case PlaylistUpdateAction.ADD:
#                 await service.add_playlist_items(playlist_id, body.uris)
#             case PlaylistUpdateAction.REMOVE:
#                 await service.delete_playlist_items(playlist_id, body.uris)
#     except PlaylistNotOwnedError:
#         raise HTTPException(status_code=403, detail="Forbidden.")
#     except SpotifyException:
#         raise HTTPException(status_code=500, detail="Failed to update items.")
