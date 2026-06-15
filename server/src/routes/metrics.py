from core.limiter import limiter
from fastapi import APIRouter, Request, Depends
from database.service import get_database_service, DatabaseService, GlobalSwipeMetrics


router = APIRouter()


@router.get("/")
@limiter.limit("120/minute")
async def get_global_swipe_metrics(
    request: Request,
    db: DatabaseService = Depends(get_database_service),
) -> GlobalSwipeMetrics:
    return await db.get_global_swipe_metrics()
