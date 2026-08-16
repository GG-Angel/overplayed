from core.limiter import limiter
from dtos import (
    QueueEnrollmentForm,
    QueueOverviewResponse,
    UserActiveResponse,
    UserInQueueResponse,
)
from fastapi import APIRouter, Depends, HTTPException, Request
from services.queue import QueueService, UserStatus
from services.turnstile import TurnstileVerifier
from state import get_queue_service, get_turnstile_verifier

router = APIRouter()


def _status_response(
    email: str, status: UserStatus | None
) -> UserActiveResponse | UserInQueueResponse:
    """Map an internal user status onto its public response DTO."""
    if status is None:
        raise HTTPException(status_code=404, detail="User not found.")

    match status.status:
        case "active":
            return UserActiveResponse(email=email, estimated_end_time=status.end_time)
        case "in_queue":
            return UserInQueueResponse(
                email=email,
                position_in_queue=status.position,
                estimated_start_time=status.start_time,
            )


@router.get("")
@limiter.limit("60/minute")
async def get_overview(
    request: Request,
    service: QueueService = Depends(get_queue_service),
) -> QueueOverviewResponse:
    summary = await service.get_queue_overview()
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
    service: QueueService = Depends(get_queue_service),
) -> UserActiveResponse | UserInQueueResponse:
    status = await service.get_user_status(email)
    return _status_response(email, status)


@router.post("")
@limiter.limit("5/hour")
async def request_access(
    request: Request,
    form: QueueEnrollmentForm,
    service: QueueService = Depends(get_queue_service),
    turnstile: TurnstileVerifier = Depends(get_turnstile_verifier),
):
    await turnstile.validate_request(request, form)

    if (user_status := await service.get_user_status(form.email)) is not None:
        return _status_response(form.email, user_status)

    # validate user, return 404 if doesn't exist

    # start task to send email
    # return {"message": "Request received. If your email is valid, you will receive an email with further instructions."}
