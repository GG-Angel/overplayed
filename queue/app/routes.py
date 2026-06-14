from pydantic import BaseModel
from fastapi import APIRouter, Request, Depends
from user_manager import NewUser, USER_LIMIT
from state import State, get_state


class QueueDetails(BaseModel):
    active_users: int
    available_slots: int
    queue_size: int


class QueuePosition(BaseModel):
    position: int


router = APIRouter()


@router.get("/queue")
async def get_queue(
    request: Request,
    state: State = Depends(get_state),
) -> QueueDetails:
    users = await state.users.get_users()
    queue_size = await state.queue.get_size()
    return QueueDetails(
        active_users=len(users),
        available_slots=max(0, USER_LIMIT - len(users)),
        queue_size=queue_size,
    )


@router.post("/queue")
async def enqueue_user(
    request: Request,
    user: NewUser,
    state: State = Depends(get_state),
) -> QueuePosition:
    return QueuePosition(position=await state.queue.enqueue(user))
