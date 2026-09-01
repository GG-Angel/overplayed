from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request

from src.core.limiter import limiter
from src.services.previews.dependencies import get_deezer_service
from src.services.previews.models import IsrcPattern, TrackPreview
from src.services.previews.service import DeezerService

router = APIRouter()


@router.get("/{isrc}")
@limiter.limit("120/minute")
async def handle_get_track_preview(
    request: Request,
    isrc: Annotated[str, Path(pattern=IsrcPattern)],
    service: DeezerService = Depends(get_deezer_service),
) -> TrackPreview:
    return await service.get_track_preview(isrc)
