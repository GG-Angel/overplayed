from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class QueueSignUpForm(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str
    turnstile_token: str = Field(alias="cf-turnstile-response")


class QueueOverviewResponse(BaseModel):
    num_active: int
    num_queued: int
    user_limit: int
    next_available_time: datetime | None


class UserActiveResponse(BaseModel):
    status: Literal["active"] = "active"
    email: str
    estimated_end_time: datetime


class UserInQueueResponse(BaseModel):
    status: Literal["in_queue"] = "in_queue"
    email: str
    position_in_queue: int
    estimated_start_time: datetime


class UserNotInQueueResponse(BaseModel):
    status: Literal["not_in_queue"] = "not_in_queue"
    email: str
