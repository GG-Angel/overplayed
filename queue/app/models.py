from pydantic.alias_generators import to_camel
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class NewUser(BaseModel):
    name: str
    email: str


class QueuedUser(BaseModel):
    email: str
    retries: int
    created_at: datetime


class ActiveUser(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=False,
    )

    id: str
    name: str
    email: str
    client_id: str
    created_at: datetime
