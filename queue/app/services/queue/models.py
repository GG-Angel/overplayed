from datetime import datetime
from typing import Literal

from models import ActiveUser, QueuedUser
from pydantic import BaseModel


class QueueEntry(BaseModel):
    """A queued user together with their 1-based position in the queue."""

    user: QueuedUser
    position: int


class InQueueStatus(BaseModel):
    status: Literal["in_queue"] = "in_queue"
    position: int
    user: QueuedUser
    start_time: datetime


class ActiveStatus(BaseModel):
    status: Literal["active"] = "active"
    user: ActiveUser
    end_time: datetime


UserStatus = InQueueStatus | ActiveStatus


class QueueSummary(BaseModel):
    """Overview of the queue: active users, queued users, and next available time."""

    active_users: list[ActiveUser]
    queued_users: list[QueuedUser]
    user_limit: int
    next_available_time: datetime | None
