from core.limiter import limiter
from core.exceptions import NotFoundException
from typing import Annotated
from fastapi import APIRouter, Depends, Path, Request
from .service import DeezerService
from .dependencies import get_deezer_service
from .models import TrackPreview
from .models import IsrcPattern


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
