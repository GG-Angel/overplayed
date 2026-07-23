from fastapi import APIRouter, Depends, HTTPException
from services.queue import QueueService
from state import get_queue_service
from models import NewUser
from errors import SpotifyError, QueueLockError
from dtos import (
    QueueOverviewResponse,
    QueueSignUpForm,
    UserActiveResponse,
    UserInQueueResponse,
    UserNotInQueueResponse,
    UserStatusResponse,
)


router = APIRouter()


@router.get("/")
async def get_overview(
    queue_service: QueueService = Depends(get_queue_service),
) -> QueueOverviewResponse:
    result = await queue_service.get_queue_overview()
    return QueueOverviewResponse(
        num_active=len(result.active_users),
        num_queued=len(result.queued_users),
        user_limit=result.user_limit,
        next_available_time=result.next_available_time,
    )


@router.post("/")
async def join_queue(
    form: QueueSignUpForm,
    queue_service: QueueService = Depends(get_queue_service),
) -> UserActiveResponse | UserInQueueResponse:
    try:
        new_user = NewUser(name=form.name, email=form.email)
        result = await queue_service.enqueue_user(new_user)
    except QueueLockError:
        raise HTTPException(status_code=503, detail="Queue is busy.")
    except SpotifyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    match result.status:
        case "active":
            return UserActiveResponse(
                name=result.user.name,
                estimated_end_time=result.end_time,
            )
        case "in_queue":
            return UserInQueueResponse(
                name=result.user.name,
                position_in_queue=result.position,
                estimated_start_time=result.start_time,
            )
        case _:
            raise HTTPException(status_code=500, detail="Unexpected status")


@router.get("/{email}")
async def get_user_status(
    email: str,
    queue_service: QueueService = Depends(get_queue_service),
) -> UserStatusResponse:
    result = await queue_service.get_user_status(email)

    match result.status:
        case "active":
            return UserActiveResponse(
                name=result.user.name,
                estimated_end_time=result.end_time,
            )
        case "in_queue":
            return UserInQueueResponse(
                name=result.user.name,
                position_in_queue=result.position,
                estimated_start_time=result.start_time,
            )
        case _:
            return UserNotInQueueResponse()
