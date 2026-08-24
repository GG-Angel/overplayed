from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class QueueOverviewResponse(BaseModel):
    total_slots: int
    filled_slots: int
    open_slots: int
    num_waiting: int
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


class ConfirmationPendingResponse(BaseModel):
    status: Literal["confirmation_pending"] = "confirmation_pending"
    email: str


AccessStatusResponse = (
    ConfirmationPendingResponse | ActiveUserStatusResponse | QueuedUserStatusResponse
)
