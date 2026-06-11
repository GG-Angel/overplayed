from core.exceptions import NotFoundException
from typing import Annotated
from core.limiter import limiter
from fastapi import APIRouter, Request, Path, Depends
from .models import IsrcPattern, TrackPreview
from .service import DeezerService
from .dependencies import get_deezer_service


router = APIRouter()


@router.get("/{isrc}")
@limiter.limit("300/minute")
async def handle_get_track_preview(
    request: Request,
    isrc: Annotated[str, Path(pattern=IsrcPattern)],
    service: DeezerService = Depends(get_deezer_service),
) -> TrackPreview:
    preview = await service.get_track_preview(isrc)
    if preview is None:
        raise NotFoundException()
    return preview
