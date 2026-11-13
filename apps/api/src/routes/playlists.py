from collections.abc import AsyncIterable
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Path, Request
from fastapi.responses import StreamingResponse

from src.core.limiter import limiter
from src.routes.schemas import PlaylistResponse, SwipesResponse, TrackResponse
from src.services.spotify.dependencies import get_spotify_service
from src.services.spotify.models import Playlist, PlaylistIdRegex
from src.services.spotify.service import SpotifyService
from src.services.swipe.dependencies import get_swipe_service
from src.services.swipe.models import SwipesForm
from src.services.swipe.service import SwipeService

router = APIRouter()

STREAM_CHUNK_BYTES = 32 * 1024


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


@router.get("/{playlist_id}/tracks")
@limiter.limit("30/minute")
async def handle_get_playlist_tracks(
    request: Request,
    playlist_id: Annotated[str, Path(pattern=PlaylistIdRegex)],
    spotify: SpotifyService = Depends(get_spotify_service),
) -> StreamingResponse:
    async def stream_tracks() -> AsyncIterable[str]:
        """Stream tracks as NDJSON, batched to avoid one send per track."""
        chunk: list[str] = []
        chunk_size = 0

        async for track in spotify.get_playlist_tracks(playlist_id):
            line = TrackResponse.model_validate(track).model_dump_json() + "\n"
            chunk.append(line)
            chunk_size += len(line)

            if chunk_size >= STREAM_CHUNK_BYTES:
                yield "".join(chunk)
                chunk.clear()
                chunk_size = 0

        if chunk:
            yield "".join(chunk)

    return StreamingResponse(stream_tracks(), media_type="application/x-ndjson")


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
    return SwipesResponse(
        backup_playlist=PlaylistResponse.model_validate(backup) if backup else None
    )
