from core.exceptions import NotFoundException
from typing import Annotated
from fastapi import APIRouter, Request, Path, Depends
from core.limiter import limiter
from api.services.previews.service import DeezerService
from api.services.previews.dependencies import get_deezer_service
from api.services.previews.models import IsrcPattern, TrackPreview


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
