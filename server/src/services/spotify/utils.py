from datetime import UTC, datetime
from typing import get_args, get_origin

from pydantic import BaseModel

from services.spotify.models import (
    LIKED_SONGS_ID,
    CurrentUser,
    ExternalUrls,
    Playlist,
    User,
    SessionInfo,
    TokenInfo,
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
        tracks=Playlist.Tracks(total=total),
        external_urls=ExternalUrls(
            spotify="https://open.spotify.com/collection/tracks"
        ),
    )


def build_session_info(user: CurrentUser, token_info: TokenInfo) -> SessionInfo:
    return SessionInfo(
        user_id=user.id,
        email=user.email,
        access_token=token_info.access_token,
        refresh_token=token_info.refresh_token,
        token_type=token_info.token_type,
        expires_in=token_info.expires_in,
        expires_at=token_info.expires_at,
        scope=token_info.scope,
    )


def get_formatted_date() -> str:
    """Return the current UTC date formatted as 'Month D, YYYY'"""
    return datetime.now(UTC).strftime("%B %-d, %Y")
