from models import SwipeSessionRequest
from pydantic import BaseModel
from services import SpotifyService
from enum import StrEnum
from dependencies import get_metrics, get_spotify_service
from database import MetricRepository
from limiter import limiter
from fastapi import APIRouter, Request, Depends, HTTPException

router = APIRouter()


class Metric(StrEnum):
    TOTAL_TRACKS_CUT = "total_tracks_cut"
    TOTAL_SESSIONS = "total_sessions"


class MetricResponse(BaseModel):
    metric: Metric
    value: int


@router.get("/{metric}")
@limiter.limit("120/minute")
async def get_metric(
    request: Request,
    metric: Metric,
    metrics: MetricRepository = Depends(get_metrics),
) -> MetricResponse:
    match metric:
        case Metric.TOTAL_TRACKS_CUT:
            value = await metrics.total_tracks_cut()
        case Metric.TOTAL_SESSIONS:
            value = await metrics.total_sessions()

    return MetricResponse(metric=metric, value=value)


@router.post("/swipe-sessions")
@limiter.limit("30/minute")
async def record_swipe_session(
    request: Request,
    body: SwipeSessionRequest,
    spotify: SpotifyService = Depends(get_spotify_service),
    metrics: MetricRepository = Depends(get_metrics),
) -> None:
    if body.tracks_swiped > body.total_tracks:
        raise HTTPException(422, "tracks_swiped exceeds total_tracks")
    if body.tracks_cut > body.tracks_swiped:
        raise HTTPException(422, "tracks_cut exceeds tracks_swiped")

    await metrics.record_swipe_session(user_id=spotify.user_id, session=body)
