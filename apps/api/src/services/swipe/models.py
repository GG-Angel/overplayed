from typing import Annotated

from pydantic import BaseModel, Field, PositiveInt

from src.services.spotify.models import TrackUriRegex


class SwipesFormOptions(BaseModel):
    backup_enabled: bool
    remove_from_likes: bool


class SwipesForm(BaseModel):
    options: SwipesFormOptions
    uris: list[Annotated[str, Field(pattern=TrackUriRegex)]] = Field(min_length=1)
    tracks_swiped: PositiveInt
