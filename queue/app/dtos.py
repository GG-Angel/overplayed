from typing import Literal
from datetime import datetime
from pydantic import BaseModel


class QueueSignUpForm(BaseModel):
    name: str
    email: str


class QueueOverviewResponse(BaseModel):
    num_active: int
    num_queued: int
    user_limit: int
    next_available_time: datetime | None


class UserStatusResponse(BaseModel):
    class Active(BaseModel):
        status: Literal["active"] = "active"
        name: str
        estimated_end_time: datetime

    class InQueue(BaseModel):
        status: Literal["in_queue"] = "in_queue"
        name: str
        position_in_queue: int
        estimated_wait_time: datetime

    class NotInQueue(BaseModel):
        status: Literal["not_in_queue"] = "not_in_queue"
