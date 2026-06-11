from pydantic import BaseModel, Field
from typing import List, Annotated
from fastapi import Request, Depends, APIRouter, Path, Query
from core.limiter import limiter
from .service import SpotifyService
from .dependencies import get_spotify_service
from .models import Playlist, SpotifyIdPattern, SpotifyUriPattern, PlaylistItems


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


@router.get("/{playlist_id}")
@limiter.limit("60/minute")
async def handle_get_playlist(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    service: SpotifyService = Depends(get_spotify_service),
) -> Playlist:
    return await service.get_user_playlist(playlist_id)


@router.get("/{playlist_id}/items")
@limiter.limit("60/minute")
async def handle_get_playlist_items(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=SpotifyIdPattern)],
    page: int = Query(1, ge=1),
    service: SpotifyService = Depends(get_spotify_service),
) -> PlaylistItems:
    return await service.get_playlist_items(
        playlist_id,
        offset=(page - 1) * PLAYLIST_ITEMS_PAGE_LIMIT,
        limit=PLAYLIST_ITEMS_PAGE_LIMIT,
    )


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
