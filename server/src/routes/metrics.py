from core.limiter import limiter
from fastapi import APIRouter, Request, Depends
from services.metrics.service import (
    get_metric_service,
    MetricService,
    GlobalSwipeMetrics,
)


router = APIRouter()


@router.get("/")
@limiter.limit("120/minute")
async def get_global_swipe_metrics(
    request: Request, metrics: MetricService = Depends(get_metric_service)
) -> GlobalSwipeMetrics:
    return await metrics.get_global_swipe_metrics()
