from spotipy import Spotify
from fastapi import APIRouter, Depends
from dependencies import get_spotify

router = APIRouter()


@router.get("/")
async def handle_user(spotify: Spotify = Depends(get_spotify)):
    return spotify.me()
