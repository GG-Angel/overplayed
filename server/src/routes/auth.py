from settings import Settings
from redis import RedisError
from spotipy import SpotifyOauthError, SpotifyOAuth
from dependencies import get_oauth, get_redis, get_settings
from models import TokenInfo
from typing import Optional
from fastapi import APIRouter, Depends, Cookie
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
    fail_response = JSONResponse({"message": "Authorization failed."}, status_code=401)

    if error or not code:
        return fail_response

    try:
        token_info = TokenInfo(**oauth.get_access_token(code, check_cache=False))
        session_id = await redis.create_session(token_info)
    except (SpotifyOauthError, RedisError):
        return fail_response

    response = JSONResponse({"message": "Authorization successful."}, status_code=200)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.redis.ttl_tokens,
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
        return JSONResponse({"message": "Failed to log out."}, status_code=500)

    response = JSONResponse({"message": "Logged out successfully."}, status_code=200)
    response.delete_cookie(
        key="session_id",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )
    return response
