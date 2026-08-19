from urllib.parse import quote
from core.limiter import limiter
from dtos import (
    QueueEnrollmentForm,
    QueueOverviewResponse,
    UserActiveResponse,
    UserInQueueResponse,
    OnboardingResponse,
)
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    status,
    Response,
)
from fastapi.responses import RedirectResponse
from services.queue import EmailService, QueueService, UserStatus
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


@router.post("/requests")
@limiter.limit("5/hour")
async def request_access(
    request: Request,
    response: Response,
    form: QueueEnrollmentForm,
    background_tasks: BackgroundTasks,
    service: QueueService = Depends(get_queue_service),
    emailer: EmailService = Depends(get_queue_emailer),
    turnstile: TurnstileVerifier = Depends(get_turnstile_verifier),
) -> OnboardingResponse | UserActiveResponse | UserInQueueResponse:
    if not settings.app_debug:
        await turnstile.validate_request(request, form)

    user_status = await service.get_user_status(form.email)
    if user_status is not None:
        response.status_code = status.HTTP_200_OK
        return _status_response(form.email, user_status)

    if await emailer.has_pending_token(form.email):
        response.status_code = status.HTTP_409_CONFLICT
        return OnboardingResponse(status="confirmation_pending", email=form.email)

    background_tasks.add_task(emailer.register_user, form.email)
    response.status_code = status.HTTP_202_ACCEPTED
    return OnboardingResponse(status="confirmation_sent", email=form.email)


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
