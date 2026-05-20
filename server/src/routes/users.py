from models import CurrentUser
from fastapi import APIRouter, Depends, Request
from dependencies import get_spotify_service
from services.spotify import SpotifyService
from limiter import limiter

router = APIRouter()


@router.get("/me")
@limiter.limit("30/minute")
async def handle_get_user(
    request: Request,
    spotify: SpotifyService = Depends(get_spotify_service),
) -> CurrentUser:
    return await spotify.get_user()
