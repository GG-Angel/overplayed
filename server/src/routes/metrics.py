from pydantic import BaseModel
from enum import StrEnum
from dependencies import get_metrics
from database import MetricRepository
from limiter import limiter
from fastapi import APIRouter, Request, Depends

router = APIRouter()


class Metric(StrEnum):
    TRACK_CUT_COUNT = "track_cut_count"
    SESSION_COUNT = "session_count"


class MetricResponse(BaseModel):
    metric: Metric
    value: int


@router.get("/{metric}")
@limiter.limit("120/minute")
async def get_metric(
    request: Request,
    metric: Metric,
    repository: MetricRepository = Depends(get_metrics),
) -> MetricResponse:
    match metric:
        case Metric.TRACK_CUT_COUNT:
            value = await repository.count_tracks_cut()
        case Metric.SESSION_COUNT:
            value = await repository.count_sessions()

    return MetricResponse(metric=metric, value=value)
