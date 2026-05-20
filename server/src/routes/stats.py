from limiter import limiter
from dependencies import get_counters
from fastapi import APIRouter, Request, Depends
from cache.repositories import Event, EventCounters

router = APIRouter()


@router.get("/{event}")
@limiter.limit("120/minute")
async def get_counter(
    request: Request,
    event: Event,
    counters: EventCounters = Depends(get_counters),
) -> dict[str, str | int]:
    return {"event": event, "count": await counters.get(event)}
