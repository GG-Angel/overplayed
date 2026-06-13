from core.exceptions import UnauthorizedException
from typing import Optional
import asyncio
from spotipy import SpotifyOAuth, Spotify
from time import time
from core.config import Settings
from fastapi import Depends, Cookie
from api.cache.client import RedisClient, get_redis_client
from api.dependencies import get_settings, get_oauth
from .models import SessionInfo, TokenInfo
from .cache import SpotifyCache
from .service import SpotifyService
from .client import SpotifyClient


TOKEN_EXPIRY_BUFFER = 120


def get_spotify_cache(
    redis: RedisClient = Depends(get_redis_client),
    settings: Settings = Depends(get_settings),
) -> SpotifyCache:
    return SpotifyCache(redis=redis, settings=settings.redis)


async def get_spotify_service(
    session_id: Optional[str] = Cookie(default=None),
    oauth: SpotifyOAuth = Depends(get_oauth),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> SpotifyService:
    if not session_id or not (session := await cache.get_session(session_id)):
        raise UnauthorizedException()

    if _is_token_expired(session.expires_at):
        new_token = await _refresh_token(oauth, session)
        session = SessionInfo(user_id=session.user_id, **new_token.model_dump())
        await cache.set_session(session_id, session)

    return SpotifyService(
        spotify=SpotifyClient(
            spotify=Spotify(auth=session.access_token),
            settings=settings.spotify,
            user_id=session.user_id,
        ),
        cache=cache,
        user_id=session.user_id,
    )


def _is_token_expired(expires_at: int) -> bool:
    return expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def _refresh_token(oauth: SpotifyOAuth, token: SessionInfo) -> TokenInfo:
    refreshed = await asyncio.to_thread(oauth.refresh_access_token, token.refresh_token)
    return TokenInfo(**refreshed)
