from services.spotify.service import SpotifyService
from services.spotify.utils import build_session_info
import asyncio
from urllib.parse import urlsplit, urlunsplit

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from loguru import logger
from redis.asyncio import RedisError
from spotipy import Spotify, SpotifyOAuth

from core.limiter import limiter
from services.spotify.cache import SpotifyCache
from services.spotify.dependencies import get_spotify_cache, get_spotify_service
from services.spotify.models import CurrentUser, TokenInfo
from settings import Settings
from state import get_oauth, get_settings

router = APIRouter()


@router.get("/login")
@limiter.limit("15/minute")
def handle_login(
    request: Request,
    redirect_to: str = "/",
    oauth: SpotifyOAuth = Depends(get_oauth),
) -> RedirectResponse:
    """Provides the Spotify OAuth url for this application."""
    if not _is_valid_redirect_path(redirect_to):
        raise HTTPException(status_code=400, detail="Invalid redirect path.")
    return RedirectResponse(url=oauth.get_authorize_url(state=redirect_to))


@router.get("/callback")
@limiter.limit("15/minute")
async def handle_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
    oauth: SpotifyOAuth = Depends(get_oauth),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """Exchanges the OAuth code for an access token and starts a new session."""

    def redirect_error() -> RedirectResponse:
        return RedirectResponse(f"{settings.app_frontend_url}/access?error=no_access")

    redirect_to = state or "/"
    if error or not code or not _is_valid_redirect_path(redirect_to):
        return redirect_error()

    try:
        token_info = TokenInfo(**oauth.get_access_token(code, check_cache=False))
        spotify = Spotify(auth=token_info.access_token)
        user = CurrentUser(**await asyncio.to_thread(spotify.current_user))
        session_info = build_session_info(user, token_info)
        session_id = await cache.create_session(session_info)
    except Exception:
        return redirect_error()

    response = RedirectResponse(
        url=_build_redirect_url(settings.app_frontend_url, redirect_to)
    )
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=settings.ttl_sessions,
        secure=not settings.app_debug,
    )
    logger.info(f"Authorized user: {user.display_name}")
    return response


@router.post("/logout")
@limiter.limit("15/minute")
async def handle_logout(
    request: Request,
    session_id: str = Cookie(),
    cache: SpotifyCache = Depends(get_spotify_cache),
    service: SpotifyService = Depends(get_spotify_service),
    settings: Settings = Depends(get_settings),
) -> JSONResponse:
    """Revoke the session token and delete the cookie on the client."""
    try:
        user = await service.get_current_user()
        await cache.end_session(session_id, user.email)
    except RedisError:
        raise HTTPException(detail="Failed to log out.", status_code=500)

    response = JSONResponse({"detail": "Logged out successfully."}, status_code=200)
    response.delete_cookie(
        key="session_id",
        httponly=True,
        samesite="lax",
        secure=not settings.app_debug,
    )
    return response


def _is_valid_redirect_path(path: str) -> bool:
    """Checks if the path is a valid relative path."""
    parsed = urlsplit(path)
    return (
        not parsed.scheme
        and not parsed.netloc
        and parsed.path.startswith("/")
        and not parsed.path.startswith("//")
    )


def _build_redirect_url(url: str, path: str) -> str:
    """Builds a redirect URL confined to the frontend's origin."""
    parsed_url = urlsplit(url)
    parsed_path = urlsplit(path)
    return urlunsplit((parsed_url.scheme, parsed_url.netloc, parsed_path.path, "", ""))
