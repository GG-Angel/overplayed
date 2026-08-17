from urllib.parse import quote
from core.limiter import limiter
from dtos import (
    QueueEnrollmentForm,
    QueueOverviewResponse,
    UserActiveResponse,
    UserInQueueResponse,
)
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from services.queue import QueueEmailer, QueueService, UserStatus
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
) -> UserActiveResponse | UserInQueueResponse:
    status = await service.get_user_status(email)
    if status is None:
        raise HTTPException(status_code=404)
    return _status_response(email, status)


@router.post("/requests", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/hour")
async def request_access(
    request: Request,
    form: QueueEnrollmentForm,
    background_tasks: BackgroundTasks,
    service: QueueService = Depends(get_queue_service),
    emailer: QueueEmailer = Depends(get_queue_emailer),
    turnstile: TurnstileVerifier = Depends(get_turnstile_verifier),
):
    if not settings.debug:
        await turnstile.validate_request(request, form)
    if await service.get_user_status(form.email) is None:
        background_tasks.add_task(emailer.onboard_user, form.email)


@router.get("/verifications/{token}")
@limiter.limit("5/hour")
async def verify_token(
    request: Request,
    token: str,
    service: QueueService = Depends(get_queue_service),
    emailer: QueueEmailer = Depends(get_queue_emailer),
):
    """Verify a one-time token and enqueue the user if valid."""
    email = await emailer.resolve_token(token)
    if email is None:
        return RedirectResponse(
            url=f"{settings.frontend_url}/access/invalid",
            status_code=status.HTTP_302_FOUND,
        )

    await service.enqueue_user(email)
    return RedirectResponse(
        url=f"{settings.frontend_url}/access/verified?email={quote(email)}",
        status_code=status.HTTP_302_FOUND,
    )


def _status_response(
    email: str, status: UserStatus
) -> UserActiveResponse | UserInQueueResponse:
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
