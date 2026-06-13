from core.exceptions import NotFoundException
from typing import Annotated
from fastapi import APIRouter, Request, Path, Depends
from core.limiter import limiter
from services.previews.service import DeezerService
from services.previews.dependencies import get_deezer_service
from services.previews.models import IsrcPattern, TrackPreview


router = APIRouter()


@router.get("/{isrc}")
@limiter.limit("120/minute")
async def handle_get_track_preview(
    request: Request,
    isrc: Annotated[str, Path(pattern=IsrcPattern)],
    service: DeezerService = Depends(get_deezer_service),
) -> TrackPreview:
    preview = await service.get_track_preview(isrc)
    if preview is None:
        raise NotFoundException()
    return preview
