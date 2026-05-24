import asyncio
from loguru import logger
from urllib.parse import urlencode, urlparse
from settings import Settings
from redis.asyncio import RedisError
from spotipy import SpotifyOauthError, SpotifyOAuth, Spotify, SpotifyException
from dependencies import get_oauth, get_settings, get_spotify_cache
from models import TokenInfo, SessionInfo, CurrentUser
from typing import Optional
from fastapi import APIRouter, Depends, Cookie, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from cache import SpotifyCache
from limiter import limiter

router = APIRouter()


@router.get("/login")
@limiter.limit("15/minute")
def handle_login(
    request: Request,
    redirect_to: str = "/",
    oauth: SpotifyOAuth = Depends(get_oauth),
) -> RedirectResponse:
    """Provides the Spotify OAuth url for this application."""
    parsed = urlparse(redirect_to)
    if parsed.scheme or parsed.netloc or not redirect_to.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid redirect path.")
    return RedirectResponse(url=oauth.get_authorize_url(state=redirect_to))


@router.get("/callback")
@limiter.limit("15/minute")
async def handle_callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None,
    oauth: SpotifyOAuth = Depends(get_oauth),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """Exchanges the OAuth code for an access token and starts a new session."""

    def redirect_error() -> RedirectResponse:
        params = urlencode({"error": "authorization_failed"})
        return RedirectResponse(f"{settings.frontend_url}/login?{params}")

    if error or not code:
        return redirect_error()

    try:
        token_info = TokenInfo(**oauth.get_access_token(code, check_cache=False))
        spotify = Spotify(auth=token_info.access_token)
        user = CurrentUser(**await asyncio.to_thread(spotify.current_user))

        session_info = SessionInfo(user_id=user.id, **token_info.model_dump())
        session_id = await cache.create_session(session_info)
    except (SpotifyOauthError, SpotifyException, RedisError):
        return redirect_error()

    redirect_to = state or "/"
    response = RedirectResponse(url=f"{settings.frontend_url}{redirect_to}")
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=settings.redis.ttl_sessions,
        secure=not settings.debug,
    )

    logger.info(f"Authorized user: {user.display_name}")
    return response


@router.post("/logout")
@limiter.limit("15/minute")
async def handle_logout(
    request: Request,
    session_id: str = Cookie(),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> JSONResponse:
    """Revoke the session token and delete the cookie on the client."""
    try:
        await cache.end_session(session_id)
    except RedisError:
        raise HTTPException(detail="Failed to log out.", status_code=500)

    response = JSONResponse({"detail": "Logged out successfully."}, status_code=200)
    response.delete_cookie(
        key="session_id",
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
    )
    return response
