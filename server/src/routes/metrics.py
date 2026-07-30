from fastapi import APIRouter, Depends, Request

from core.limiter import limiter
from database.service import DatabaseService, get_database_service
from routes.schemas import GlobalSwipeMetricsResponse, UserSwipeMetricsResponse
from services.spotify.dependencies import get_spotify_service
from services.spotify.service import SpotifyService

router = APIRouter()


@router.get("")
@limiter.limit("120/minute")
async def get_global_swipe_metrics(
    request: Request,
    db: DatabaseService = Depends(get_database_service),
) -> GlobalSwipeMetricsResponse:
    return GlobalSwipeMetricsResponse.from_aggregates(
        await db.get_global_swipe_metrics()
    )


@router.get("/me")
@limiter.limit("120/minute")
async def get_user_swipe_metrics(
    request: Request,
    db: DatabaseService = Depends(get_database_service),
    spotify: SpotifyService = Depends(get_spotify_service),
) -> UserSwipeMetricsResponse:
    return UserSwipeMetricsResponse.from_aggregates(
        await db.get_user_swipe_metrics(user_id=spotify.user_id)
    )
