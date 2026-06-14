from fastapi import APIRouter, Request, Depends
from user_manager import NewUser
from queue_manager import QueueManager
from state import get_queue_manager


router = APIRouter()


@router.get("/queue")
async def view_queue():
    pass


@router.post("/queue")
async def enqueue_user(
    request: Request,
    user: NewUser,
    queue_manager: QueueManager = Depends(get_queue_manager),
):
    await queue_manager.enqueue(user)
