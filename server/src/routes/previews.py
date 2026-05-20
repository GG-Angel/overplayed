from typing import Annotated
from models import TrackPreview, IsrcPattern
from dependencies import get_deezer_service
from fastapi import APIRouter, Depends, HTTPException, Path
from services.deezer import DeezerService


router = APIRouter()


@router.get("/{isrc}", status_code=200)
async def handle_get_track_preview_url(
    isrc: Annotated[str, Path(pattern=IsrcPattern)],
    service: DeezerService = Depends(get_deezer_service),
) -> TrackPreview:
    if preview_url := await service.get_track_preview_url(isrc):
        return TrackPreview(preview_url=preview_url)

    raise HTTPException(status_code=404, detail="Not found.")
