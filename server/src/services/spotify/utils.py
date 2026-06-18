from datetime import datetime
from typing import get_args, get_origin
from pydantic import BaseModel
from services.spotify.models import (
    CurrentUser,
    Playlist,
    LIKED_SONGS_ID,
    User,
    PlaylistSize,
    ExternalUrls,
)


def spotify_fields(model: type[BaseModel], is_nested: bool = False) -> str:
    """Generate Spotify API field string from a Pydantic model."""
    fields = []

    for name, field in model.model_fields.items():
        annotation = field.annotation
        origin = get_origin(annotation)

        if origin is list:
            arg = get_args(annotation)[0]
            if isinstance(arg, type) and issubclass(arg, BaseModel):
                fields.append(f"{name}({spotify_fields(arg, False)})")
            else:
                fields.append(name)

        elif isinstance(annotation, type) and issubclass(annotation, BaseModel):
            fields.append(f"{name}({spotify_fields(annotation, False)})")

        else:
            fields.append(name)

    fields_str = ",".join(fields)
    return f"items({fields_str})" if is_nested else fields_str


def build_liked_songs_playlist(user: CurrentUser, total: int) -> Playlist:
    return Playlist(
        id=LIKED_SONGS_ID,
        uri=LIKED_SONGS_ID,
        snapshot_id=f"liked-{total}",
        collaborative=False,
        public=False,
        images=None,
        name="Liked Songs",
        description=None,
        owner=User.model_validate(user.model_dump()),
        tracks=PlaylistSize(total=total),
        external_urls=ExternalUrls(
            spotify="https://open.spotify.com/collection/tracks"
        ),
    )


def get_formatted_date() -> str:
    """Return the current date formatted as 'Month D, YYYY'"""
    return datetime.now().strftime("%B %-d, %Y")
