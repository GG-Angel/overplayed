from models import SwipeSessionRequest
from pydantic import BaseModel
from services import SpotifyService
from enum import StrEnum
from dependencies import get_metrics, get_spotify_service
from database import MetricRepository
from limiter import limiter
from fastapi import APIRouter, Request, Depends, HTTPException


class Metric(StrEnum):
    TOTAL_SESSIONS = "total_sessions"
    TOTAL_USERS = "total_users"
    TOTAL_CUTS = "total_cuts"
    CUT_RATE = "cut_rate"
    SWIPE_DURATION = "swipe_duration"
    SESSION_DURATION = "session_duration"


class MetricResponse(BaseModel):
    metric: Metric
    value: float


router = APIRouter()


@router.get("/{metric}")
@limiter.limit("120/minute")
async def get_metric(
    request: Request,
    metric: Metric,
    metrics: MetricRepository = Depends(get_metrics),
) -> MetricResponse:
    match metric:
        case Metric.TOTAL_SESSIONS:
            value = await metrics.get_total_sessions()
        case Metric.TOTAL_USERS:
            value = await metrics.get_unique_users()
        case Metric.TOTAL_CUTS:
            value = await metrics.get_total_tracks_cut()
        case Metric.CUT_RATE:
            value = await metrics.get_track_cut_rate()
        case Metric.SWIPE_DURATION:
            value = await metrics.get_average_swipe_duration()
        case Metric.SESSION_DURATION:
            value = await metrics.get_average_session_duration()

    return MetricResponse(metric=metric, value=float(value))


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
