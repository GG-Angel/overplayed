from aiohttp import ClientSession
import asyncio
from typing import Optional
from time import time
from spotipy import SpotifyOAuth, Spotify
from settings import STATE_KEY, Settings
from state import State
from fastapi import Depends, Request, Cookie, HTTPException
from models import TokenInfo, SessionInfo
from services.spotify import SpotifyService
from services.deezer import DeezerService
from clients.spotify.client import SpotifyClient
from clients.deezer.client import DeezerClient
from cache.core import RedisCore
from cache.repositories import SpotifyCache, DeezerCache, EventCounters


TOKEN_EXPIRY_BUFFER = 120


def get_state(request: Request) -> State:
    return request.app.state[STATE_KEY]


def get_redis(request: Request) -> RedisCore:
    return get_state(request).redis


def get_settings(request: Request) -> Settings:
    return get_state(request).settings


def get_oauth(request: Request) -> SpotifyOAuth:
    return get_state(request).oauth


def get_session(request: Request) -> ClientSession:
    return get_state(request).session


def get_spotify_cache(
    core: RedisCore = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> SpotifyCache:
    return SpotifyCache(core=core, settings=settings.redis)


def get_deezer_cache(
    core: RedisCore = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> DeezerCache:
    return DeezerCache(core=core, settings=settings.redis)


def get_counters(core: RedisCore = Depends(get_redis)) -> EventCounters:
    return EventCounters(core=core)


def _is_token_expired(expires_at: int) -> bool:
    return expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def _refresh_token(oauth: SpotifyOAuth, token: SessionInfo) -> TokenInfo:
    refreshed = await asyncio.to_thread(oauth.refresh_access_token, token.refresh_token)
    return TokenInfo(**refreshed)


async def get_spotify_service(
    session_id: Optional[str] = Cookie(default=None),
    oauth: SpotifyOAuth = Depends(get_oauth),
    cache: SpotifyCache = Depends(get_spotify_cache),
    counters: EventCounters = Depends(get_counters),
    settings: Settings = Depends(get_settings),
) -> SpotifyService:
    if not session_id or not (session := await cache.get_session(session_id)):
        raise HTTPException(status_code=401, detail="Login required.")

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
        counters=counters,
        user_id=session.user_id,
    )


def get_deezer_service(
    session: ClientSession = Depends(get_session),
    cache: DeezerCache = Depends(get_deezer_cache),
    settings: Settings = Depends(get_settings),
) -> DeezerService:
    return DeezerService(
        deezer=DeezerClient(session=session, settings=settings.deezer),
        cache=cache,
    )
