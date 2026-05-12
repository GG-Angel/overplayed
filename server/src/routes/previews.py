from models import TrackPreview
from dependencies import get_deezer_service
from fastapi import APIRouter, Depends, HTTPException
from services.deezer import DeezerService


router = APIRouter()


@router.get("/{isrc}", status_code=200)
async def handle_get_track_preview_url(
    isrc: str, service: DeezerService = Depends(get_deezer_service)
) -> TrackPreview:
    if preview_url := await service.get_track_preview_url(isrc):
        return TrackPreview(preview_url=preview_url)

    raise HTTPException(status_code=404, detail="Not found.")
