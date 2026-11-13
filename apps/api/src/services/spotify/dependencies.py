import asyncio
from time import time
from typing import Any, cast

from fastapi import Cookie, Depends
from spotipy import Spotify, SpotifyOAuth

from src.cache.client import RedisClient, get_redis_client
from src.core.exceptions import UnauthorizedException
from src.services.spotify.cache import SpotifyCache, build_spotify_cache
from src.services.spotify.client import SpotifyClient
from src.services.spotify.models import CurrentUser, SessionInfo, TokenInfo
from src.services.spotify.service import SpotifyService
from src.services.spotify.utils import build_session_info
from src.settings import Settings
from src.state import State, get_oauth, get_settings, get_state

TOKEN_EXPIRY_BUFFER = 120


def get_spotify_cache(
    redis: RedisClient = Depends(get_redis_client),
    settings: Settings = Depends(get_settings),
) -> SpotifyCache:
    return build_spotify_cache(redis, settings)


async def get_spotify_service(
    session_id: str | None = Cookie(default=None),
    state: State = Depends(get_state),
    oauth: SpotifyOAuth = Depends(get_oauth),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> SpotifyService:
    if not session_id or not (session_info := await cache.get_session(session_id)):
        raise UnauthorizedException()

    if _is_token_expired(session_info.expires_at):
        new_token_info = await _refresh_token(oauth, session_info)
        spotify = Spotify(auth=new_token_info.access_token)
        user_data = cast(dict[str, Any], await asyncio.to_thread(spotify.current_user))
        user = CurrentUser(**user_data)
        session_info = build_session_info(user, new_token_info)
        await cache.set_session(session_id, session_info)
    else:
        spotify = Spotify(auth=session_info.access_token)

    return SpotifyService(
        spotify=SpotifyClient(
            spotify=spotify,
            user_id=session_info.user_id,
            playlist_limit=settings.playlist_limit,
            playlist_tracks_limit=settings.playlist_tracks_limit,
            get_saved_tracks_limit=settings.get_saved_tracks_limit,
            edit_saved_tracks_limit=settings.edit_saved_tracks_limit,
            max_pagination_offset=settings.max_pagination_offset,
        ),
        cache=cache,
        user_id=session_info.user_id,
        background_tasks=state.background_tasks,
        track_streams=state.track_streams,
    )


def _is_token_expired(expires_at: int) -> bool:
    return expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def _refresh_token(oauth: SpotifyOAuth, token: SessionInfo) -> TokenInfo:
    refreshed = await asyncio.to_thread(oauth.refresh_access_token, token.refresh_token)
    return TokenInfo(**refreshed)
