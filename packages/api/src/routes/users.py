from fastapi import APIRouter, Depends, Request

from core.limiter import limiter
from database.service import DatabaseService, get_database_service
from routes.schemas import CurrentUserResponse, LeaderboardResponse
from services.spotify.dependencies import get_spotify_service
from services.spotify.models import CurrentUser
from services.spotify.service import SpotifyService

router = APIRouter()


@router.get("/me", response_model=CurrentUserResponse)
@limiter.limit("30/minute")
async def handle_get_current_user(
    request: Request,
    spotify: SpotifyService = Depends(get_spotify_service),
) -> CurrentUser:
    return await spotify.get_current_user()


@router.get("/leaderboard")
@limiter.limit("30/minute")
async def handle_get_swipe_leaderboard(
    request: Request,
    db: DatabaseService = Depends(get_database_service),
) -> list[LeaderboardResponse]:
    entries = await db.get_swipe_leaderboard()
    return [LeaderboardResponse.from_entry(entry) for entry in entries]
