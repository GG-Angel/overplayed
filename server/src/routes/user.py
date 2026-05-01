from models import SpotifyCurrentUser
from fastapi import APIRouter, Depends
from dependencies import get_spotify, get_redis
from spotify.client import SpotifyClient
from cache.client import RedisClient

router = APIRouter()


@router.get("/")
async def handle_user(
    spotify: SpotifyClient = Depends(get_spotify),
    redis: RedisClient = Depends(get_redis),
) -> SpotifyCurrentUser:
    return await spotify.get_user(redis)
