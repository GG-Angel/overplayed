from typing import Annotated
from models import TrackPreview, IsrcPattern
from dependencies import get_deezer_service
from fastapi import APIRouter, Depends, HTTPException, Path, Request
from services import DeezerService
from limiter import limiter


router = APIRouter()


@router.get("/{isrc}", status_code=200)
@limiter.limit("300/minute")
async def handle_get_track_preview_url(
    request: Request,
    isrc: Annotated[str, Path(pattern=IsrcPattern)],
    service: DeezerService = Depends(get_deezer_service),
) -> TrackPreview:
    preview = await service.get_track_preview(isrc)
    if preview is None:
        raise HTTPException(status_code=404, detail="Not found.")
    return preview
