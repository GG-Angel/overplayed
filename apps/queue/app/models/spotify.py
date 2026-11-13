from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class SpotifyUserCreationRequest(BaseModel):
    name: str
    email: str


class SpotifyUser(BaseModel):
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


class SpotifyUsersResponse(BaseModel):
    users: list[SpotifyUser]


class SpotifyTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
