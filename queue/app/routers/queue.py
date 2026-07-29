from fastapi import APIRouter, Depends, HTTPException, Request
from services.queue import QueueService
from services.turnstile import TurnstileVerifier
from state import get_queue_service, get_turnstile_verifier
from core.limiter import limiter
from errors import QueueLockError, SpotifyValidationError
from dtos import (
    QueueOverviewResponse,
    QueueSignUpForm,
    UserActiveResponse,
    UserInQueueResponse,
)


router = APIRouter()


@router.get("")
@limiter.limit("60/minute")
async def get_overview(
    request: Request,
    queue_service: QueueService = Depends(get_queue_service),
) -> QueueOverviewResponse:
    result = await queue_service.get_queue_overview()
    return QueueOverviewResponse(
        num_active=len(result.active_users),
        num_queued=len(result.queued_users),
        user_limit=result.user_limit,
        next_available_time=result.next_available_time,
    )


@router.post("")
@limiter.limit("10/minute")
async def join_queue(
    request: Request,
    form: QueueSignUpForm,
    queue_service: QueueService = Depends(get_queue_service),
    turnstile: TurnstileVerifier = Depends(get_turnstile_verifier),
) -> UserActiveResponse | UserInQueueResponse:
    # verify Cloudflare Turnstile token
    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded_for.split(",")[0].strip() or (
        request.client.host if request.client else None
    )
    if not await turnstile.verify(form.turnstile_token, client_ip):
        raise HTTPException(status_code=403, detail="Cloudflare verification failed.")

    # enqueue user and handle potential errors
    try:
        result = await queue_service.enqueue_user(form.email)
    except QueueLockError:
        raise HTTPException(
            status_code=503,
            detail="The server is busy. Please try again later.",
        )
    except SpotifyValidationError:
        raise HTTPException(
            status_code=404,
            detail=f"No Spotify user found for '{form.email}'.",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Queue error.")

    match result.status:
        case "active":
            return UserActiveResponse(
                email=form.email,
                estimated_end_time=result.end_time,
            )
        case "in_queue":
            return UserInQueueResponse(
                email=form.email,
                position_in_queue=result.position,
                estimated_start_time=result.start_time,
            )
        case _:
            raise HTTPException(status_code=500, detail="Unexpected status.")
