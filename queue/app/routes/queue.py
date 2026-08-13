from core.limiter import limiter
from dtos import (
    QueueOverviewResponse,
    QueueSignUpForm,
    UserActiveResponse,
    UserInQueueResponse,
    UserNotInQueueResponse,
)
from errors import QueueLockError, SpotifyValidationError
from fastapi import APIRouter, Depends, HTTPException, Request
from services.queue import QueueService, UserStatus
from services.turnstile import TurnstileVerifier
from state import get_queue_service, get_turnstile_verifier

router = APIRouter()


def _status_response(
    email: str, status: UserStatus
) -> UserActiveResponse | UserInQueueResponse | UserNotInQueueResponse:
    """Map an internal user status onto its public response DTO."""
    match status.status:
        case "active":
            return UserActiveResponse(email=email, estimated_end_time=status.end_time)
        case "in_queue":
            return UserInQueueResponse(
                email=email,
                position_in_queue=status.position,
                estimated_start_time=status.start_time,
            )
        case "not_in_queue":
            return UserNotInQueueResponse(email=email)


@router.get("")
@limiter.limit("60/minute")
async def get_overview(
    request: Request,
    queue_service: QueueService = Depends(get_queue_service),
) -> QueueOverviewResponse:
    summary = await queue_service.get_queue_overview()
    return QueueOverviewResponse(
        num_active=len(summary.active_users),
        num_queued=len(summary.queued_users),
        user_limit=summary.user_limit,
        next_available_time=summary.next_available_time,
    )


@router.get("/{email}")
@limiter.limit("60/minute")
async def get_user_status(
    request: Request,
    email: str,
    queue_service: QueueService = Depends(get_queue_service),
) -> UserActiveResponse | UserInQueueResponse | UserNotInQueueResponse:
    status = await queue_service.get_user_status(email)
    return _status_response(email, status)


@router.post("")
@limiter.limit("3/hour")
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
        status = await queue_service.enqueue_user(form.email)
    except SpotifyValidationError:
        raise HTTPException(
            status_code=404,
            detail=f"No Spotify user found for '{form.email}'.",
        )
    except QueueLockError:
        raise HTTPException(
            status_code=503,
            detail="The server is busy. Please try again later.",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Queue error.")

    response = _status_response(form.email, status)
    if isinstance(response, UserNotInQueueResponse):
        raise HTTPException(status_code=500, detail="Unexpected status.")

    return response
