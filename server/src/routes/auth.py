import asyncio
from settings import Settings
from redis import RedisError
from spotipy import SpotifyOauthError, SpotifyOAuth, Spotify, SpotifyException
from dependencies import get_oauth, get_redis, get_settings
from models import TokenInfo, SessionInfo
from typing import Optional
from fastapi import APIRouter, Depends, Cookie, HTTPException
from fastapi.responses import JSONResponse
from cache.client import RedisClient

router = APIRouter()


@router.get("/login")
def handle_login(oauth: SpotifyOAuth = Depends(get_oauth)) -> JSONResponse:
    """Provides the Spotify OAuth url for this application."""
    return JSONResponse({"url": oauth.get_authorize_url()})


@router.get("/callback")
async def handle_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    oauth: SpotifyOAuth = Depends(get_oauth),
    redis: RedisClient = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> JSONResponse:
    """Exchanges the OAuth code for an access token and starts a new session."""
    failure = HTTPException(detail="Authorization failed.", status_code=401)
    if error or not code:
        raise failure

    try:
        token_info = TokenInfo(**oauth.get_access_token(code, check_cache=False))
        spotify = Spotify(auth=token_info.access_token)
        user = await asyncio.to_thread(spotify.current_user)

        session_info = SessionInfo(user_id=user["id"], **token_info.model_dump())
        session_id = await redis.create_session(session_info)
    except (SpotifyOauthError, SpotifyException, RedisError):
        raise failure

    response = JSONResponse({"message": "Authorization successful."}, status_code=200)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.redis.ttl_sessions,
    )
    return response


@router.delete("/logout")
async def handle_logout(
    session_id: str = Cookie(),
    redis: RedisClient = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> JSONResponse:
    """Revoke the session token and delete the cookie on the client."""
    try:
        await redis.end_session(session_id)
    except RedisError:
        raise HTTPException(detail="Failed to log out.", status_code=500)

    response = JSONResponse({"message": "Logged out successfully."}, status_code=200)
    response.delete_cookie(
        key="session_id",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )
    return response
