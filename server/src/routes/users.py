from models import SpotifyCurrentUser
from fastapi import APIRouter, Depends
from dependencies import get_spotify_service
from services.spotify import SpotifyService

router = APIRouter()


@router.get("/me")
async def handle_get_user(
    spotify: SpotifyService = Depends(get_spotify_service),
) -> SpotifyCurrentUser:
    return await spotify.get_user()
