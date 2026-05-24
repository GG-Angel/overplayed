from dependencies import get_event_repository
from database import EventRepository
from limiter import limiter
from fastapi import APIRouter, Request, Depends

router = APIRouter()


@router.get("/deletions")
@limiter.limit("120/minute")
async def get_deletions(
    request: Request,
    events: EventRepository = Depends(get_event_repository),
) -> dict[str, int]:
    return {"count": await events.get_total_deletions()}
