from services.spotify.models import CurrentUser
from services.spotify.dependencies import get_spotify_service
from services.spotify.service import SpotifyService
from fastapi import APIRouter, Request, Depends
from core.limiter import limiter


router = APIRouter()


@router.get("/me")
@limiter.limit("30/minute")
async def handle_get_current_user(
    request: Request,
    spotify: SpotifyService = Depends(get_spotify_service),
) -> CurrentUser:
    return await spotify.get_current_user()
