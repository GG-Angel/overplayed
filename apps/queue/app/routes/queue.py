from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from loguru import logger

from app.core.errors import InvalidTokenError, UnknownUserError
from app.core.limiter import limiter
from app.models.requests import AccessRequest
from app.models.responses import (
    AccessStatusResponse,
    ActiveUserStatusResponse,
    ConfirmationPendingResponse,
    QueuedUserStatusResponse,
    QueueOverviewResponse,
)
from app.services.queue import QueueService
from app.services.turnstile import TurnstileVerifier
from app.settings import settings
from app.state import get_queue_service, get_turnstile_verifier

router = APIRouter()


def access_redirect(**params: str) -> RedirectResponse:
    """Redirect to the frontend access page with the given query parameters."""
    return RedirectResponse(
        url=f"{settings.app_frontend_url}/access?{urlencode(params)}"
    )


@router.get("/overview")
@limiter.limit("60/minute")
async def get_overview(
    request: Request,
    service: QueueService = Depends(get_queue_service),
) -> QueueOverviewResponse:
    overview = await service.get_queue_overview()
    return QueueOverviewResponse(
        total_slots=overview.user_limit,
        filled_slots=overview.filled_slots,
        open_slots=overview.open_slots,
        num_waiting=overview.num_waiting,
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
        raise HTTPException(status_code=404, detail=f"{email} has not been registered.")
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
    try:
        await service.register_user(form.email)
    except UnknownUserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Spotify user with email {form.email} does not exist.",
        ) from e


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
    except InvalidTokenError as e:
        logger.info(f"Rejected verification token: {e}")
        return access_redirect(error="invalid_token")
    except UnknownUserError as e:
        logger.info(f"Rejected verified user: {e}")
        return access_redirect(error="unknown_user")
    except Exception as e:
        logger.error(f"Failed to verify token: {e}")
        return access_redirect(error="verification_failed")
    return access_redirect(email=email)
