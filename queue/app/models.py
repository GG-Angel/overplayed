from pydantic import BaseModel
from datetime import datetime


class NewUser(BaseModel):
    name: str
    email: str


class QueuedUser(BaseModel):
    name: str
    email: str
    retries: int
    created_at: datetime


class ActiveUser(BaseModel):
    id: str
    name: str
    email: str
    client_id: str
    created_at: datetime
