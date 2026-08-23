from urllib.parse import quote

from core.limiter import limiter
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)
from fastapi.responses import RedirectResponse
from models.requests import AccessRequest
from models.responses import (
    ConfirmationPendingResponse,
    ActiveUserStatusResponse,
    QueuedUserStatusResponse,
    QueueOverviewResponse,
    AccessStatusResponse,
)
from services.queue import EmailService, QueueService, QueueUserStatus
from services.turnstile import TurnstileVerifier
from settings import settings
from state import get_queue_emailer, get_queue_service, get_turnstile_verifier

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
    if status is not None:
        return _map_status_response(email, status)
    raise HTTPException(status_code=404, detail=f"User {email} not registered.")


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
    emailer: EmailService = Depends(get_queue_emailer),
):
    """Verify a one-time token and enqueue the user if valid."""
    email = await emailer.resolve_email_from_token(token)
    if email is None:
        return RedirectResponse(
            url=f"{settings.app_frontend_url}/access?error=invalid_token",
            status_code=status.HTTP_302_FOUND,
        )

    await service.enqueue_user(email)
    return RedirectResponse(
        url=f"{settings.app_frontend_url}/access?email={quote(email)}",
        status_code=status.HTTP_302_FOUND,
    )


def _map_status_response(email: str, status: QueueUserStatus) -> AccessStatusResponse:
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
