from services.spotify.dependencies import get_spotify_service
from services.spotify.service import SpotifyService
from core.limiter import limiter
from fastapi import APIRouter, Request, Depends
from database.service import (
    get_database_service,
    DatabaseService,
    GlobalSwipeMetrics,
    UserSwipeMetrics,
)


router = APIRouter()


@router.get("/")
@limiter.limit("120/minute")
async def get_global_swipe_metrics(
    request: Request,
    db: DatabaseService = Depends(get_database_service),
) -> GlobalSwipeMetrics:
    return await db.get_global_swipe_metrics()


@router.get("/me")
@limiter.limit("120/minute")
async def get_user_swipe_metrics(
    request: Request,
    db: DatabaseService = Depends(get_database_service),
    spotify: SpotifyService = Depends(get_spotify_service),
) -> UserSwipeMetrics:
    return await db.get_user_swipe_metrics(user_id=spotify.user_id)
