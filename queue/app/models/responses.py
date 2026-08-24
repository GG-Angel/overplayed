from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class QueueOverviewResponse(BaseModel):
    num_active: int
    num_queued: int
    user_limit: int
    next_available_time: datetime | None


class ActiveUserStatusResponse(BaseModel):
    status: Literal["active"] = "active"
    email: str
    estimated_end_time: datetime


class QueuedUserStatusResponse(BaseModel):
    status: Literal["in_queue"] = "in_queue"
    email: str
    position_in_queue: int
    estimated_start_time: datetime


class AccessRequestResponse(BaseModel):
    status: Literal["confirmation_sent", "confirmation_pending"]
    email: str
