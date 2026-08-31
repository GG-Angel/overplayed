from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from models.spotify import SpotifyUser


class QueuedUser(BaseModel):
    email: str
    retries: int
    created_at: datetime


class QueuedUserPosition(BaseModel):
    """A queued user together with their 1-based position in the queue."""

    user: QueuedUser
    position: int


class PendingUserStatus(BaseModel):
    status: Literal["confirmation_pending"] = "confirmation_pending"


class QueuedUserStatus(BaseModel):
    status: Literal["in_queue"] = "in_queue"
    position: int
    user: QueuedUser
    start_time: datetime


class ActiveUserStatus(BaseModel):
    status: Literal["active"] = "active"
    user: SpotifyUser
    end_time: datetime


QueueUserStatus = QueuedUserStatus | ActiveUserStatus | PendingUserStatus


class QueueOverview(BaseModel):
    """Overview of the queue: active users, queued users, and next available time."""

    active_users: list[SpotifyUser]
    queued_users: list[QueuedUser]
    user_limit: int
    next_available_time: datetime | None

    @property
    def filled_slots(self) -> int:
        """Slots that are spoken for, counting anyone already waiting on one."""
        claimed = len(self.active_users) + len(self.queued_users)
        return min(claimed, self.user_limit)

    @property
    def open_slots(self) -> int:
        """Slots a new user could claim right now."""
        return self.user_limit - self.filled_slots

    @property
    def num_waiting(self) -> int:
        """Users waiting on a slot that does not exist yet."""
        claimed = len(self.active_users) + len(self.queued_users)
        return max(0, claimed - self.user_limit)
