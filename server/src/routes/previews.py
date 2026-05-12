from typing import Annotated
from models import TrackPreview
from dependencies import get_deezer_service
from fastapi import APIRouter, Depends, HTTPException, Path
from services.deezer import DeezerService


router = APIRouter()

Isrc = Annotated[str, Path(pattern=r"^[A-Za-z]{2}[A-Za-z0-9]{3}[0-9]{7}$")]


@router.get("/{isrc}", status_code=200)
async def handle_get_track_preview_url(
    isrc: Isrc, service: DeezerService = Depends(get_deezer_service)
) -> TrackPreview:
    if preview_url := await service.get_track_preview_url(isrc):
        return TrackPreview(preview_url=preview_url)

    raise HTTPException(status_code=404, detail="Not found.")
