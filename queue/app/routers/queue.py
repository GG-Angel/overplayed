from fastapi import APIRouter, Depends, HTTPException
from services.queue import QueueService
from state import get_queue_service
from models import NewUser
from dtos import QueueOverviewResponse, UserStatusResponse, QueueSignUpForm
from errors import SpotifyError


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
) -> UserStatusResponse.Active | UserStatusResponse.InQueue:
    try:
        result = await queue_service.enqueue_user(
            NewUser(name=form.name, email=form.email)
        )
    except SpotifyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if result.status == "active":
        return UserStatusResponse.Active(
            name=result.user.name,
            estimated_end_time=result.end_time,
        )
    if result.status == "in_queue":
        return UserStatusResponse.InQueue(
            name=result.user.name,
            position_in_queue=result.position,
            estimated_wait_time=result.start_time,
        )

    raise HTTPException(status_code=500, detail="Unexpected status")


@router.get("/{email}")
async def get_user_status(
    email: str,
    queue_service: QueueService = Depends(get_queue_service),
) -> (
    UserStatusResponse.Active
    | UserStatusResponse.InQueue
    | UserStatusResponse.NotInQueue
):
    result = await queue_service.get_user_status(email)

    if result.status == "in_queue":
        return UserStatusResponse.InQueue(
            name=result.user.name,
            position_in_queue=result.position,
            estimated_wait_time=result.start_time,
        )

    if result.status == "active":
        return UserStatusResponse.Active(
            name=result.user.name,
            estimated_end_time=result.end_time,
        )

    return UserStatusResponse.NotInQueue()
