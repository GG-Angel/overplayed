from urllib.parse import quote

from core.limiter import limiter
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from models.requests import AccessRequest
from models.responses import (
    AccessStatusResponse,
    ActiveUserStatusResponse,
    ConfirmationPendingResponse,
    QueuedUserStatusResponse,
    QueueOverviewResponse,
)
from services.queue import QueueService
from services.turnstile import TurnstileVerifier
from settings import settings
from state import get_queue_service, get_turnstile_verifier

router = APIRouter()


@router.get("/overview")
@limiter.limit("60/minute")
async def get_overview(
    request: Request,
    service: QueueService = Depends(get_queue_service),
) -> QueueOverviewResponse:
    overview = await service.get_queue_overview()
    return QueueOverviewResponse(
        num_active=len(overview.active_users),
        num_queued=len(overview.queued_users),
        user_limit=overview.user_limit,
        next_available_time=overview.next_available_time,
    )


@router.get("/users/{email}")
@limiter.limit("60/minute")
async def get_user_status(
    request: Request,
    email: str,
    service: QueueService = Depends(get_queue_service),
) -> AccessStatusResponse:
    status = await service.get_user_status(email)
    if status is None:
        raise HTTPException(status_code=404, detail=f"User {email} not registered.")
    match status.status:
        case "active":
            return ActiveUserStatusResponse(
                email=email, estimated_end_time=status.end_time
            )
        case "in_queue":
            return QueuedUserStatusResponse(
                email=email,
                position_in_queue=status.position,
                estimated_start_time=status.start_time,
            )
        case "confirmation_pending":
            return ConfirmationPendingResponse(
                status="confirmation_pending",
                email=email,
            )


@router.post("/requests")
@limiter.limit("5/hour")
async def request_access(
    request: Request,
    form: AccessRequest,
    service: QueueService = Depends(get_queue_service),
    turnstile: TurnstileVerifier = Depends(get_turnstile_verifier),
) -> None:
    await turnstile.validate_request(request, form)
    await service.register_user(form.email)


@router.get("/verifications/{token}")
@limiter.limit("5/hour")
async def verify_token(
    request: Request,
    token: str,
    service: QueueService = Depends(get_queue_service),
):
    """Verify a one-time token and enqueue the user if valid."""
    try:
        email = await service.verify_and_enqueue_user(token)
        return RedirectResponse(
            url=f"{settings.app_frontend_url}/access?email={quote(email)}"
        )
    except Exception:
        return RedirectResponse(
            url=f"{settings.app_frontend_url}/access?error=invalid_token"
        )
