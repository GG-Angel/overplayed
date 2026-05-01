from time import time
from spotipy import SpotifyOAuth, Spotify
from settings import STATE_KEY, Settings
from state import State
from fastapi import Depends, Request, Cookie, HTTPException
from cache.client import RedisClient
from models import TokenInfo, SessionInfo
from spotify.client import SpotifyClient
from services.spotify import SpotifyService

TOKEN_EXPIRY_BUFFER = 120


def get_app_state(request: Request) -> State:
    return request.app.state[STATE_KEY]


def get_redis(request: Request) -> RedisClient:
    return get_app_state(request).redis()


def get_settings(request: Request) -> Settings:
    return get_app_state(request).settings


def get_oauth(request: Request) -> SpotifyOAuth:
    return get_app_state(request).oauth


def is_token_expired(expires_at: int) -> bool:
    return expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def refresh_token(oauth: SpotifyOAuth, token: TokenInfo) -> TokenInfo:
    return TokenInfo(**oauth.refresh_access_token(token.refresh_token))


async def get_spotify(
    session_id: str = Cookie(),
    oauth: SpotifyOAuth = Depends(get_oauth),
    redis: RedisClient = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> SpotifyClient:
    session = await redis.get_session(session_id)

    if not session:
        raise HTTPException(status_code=401, detail="Login required.")

    if is_token_expired(session.expires_at):
        new_token = await refresh_token(oauth, session)
        session = SessionInfo(user_id=session.user_id, **new_token.model_dump())
        await redis.set_session(session_id, session)

    return SpotifyClient(
        spotify=Spotify(auth=session.access_token),
        settings=settings.spotify,
        user_id=session.user_id,
    )


async def get_spotify_service(
    spotify: SpotifyClient = Depends(get_spotify),
    redis: RedisClient = Depends(get_redis),
) -> SpotifyService:
    return SpotifyService(spotify=spotify, redis=redis, user_id=spotify.user_id)
