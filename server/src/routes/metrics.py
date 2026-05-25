from database.metrics import MetricsSummary
from services import SpotifyService
from dependencies import get_metrics, get_spotify_service
from database import MetricsRepository, SwipeSessionDetails
from limiter import limiter
from fastapi import APIRouter, Request, Depends


router = APIRouter()


@router.get("/summary")
@limiter.limit("120/minute")
async def get_metrics_summary(
    request: Request,
    metrics: MetricsRepository = Depends(get_metrics),
) -> MetricsSummary:
    return await metrics.fetch_summary()


@router.post("/swipe-sessions")
@limiter.limit("30/minute")
async def record_swipe_session(
    request: Request,
    body: SwipeSessionDetails,
    spotify: SpotifyService = Depends(get_spotify_service),
    metrics: MetricsRepository = Depends(get_metrics),
) -> None:
    await metrics.record_swipe_session(user_id=spotify.user_id, session=body)
