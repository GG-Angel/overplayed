import asyncio
from binascii import Error as BinasciiError
from urllib.parse import urlencode, urlsplit, urlunsplit

from cryptography.exceptions import InvalidTag
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from loguru import logger
from pydantic import ValidationError
from redis.asyncio import RedisError
from spotipy import Spotify

from core.limiter import limiter
from core.oauth import SpotifyOAuthPKCE
from services.spotify.cache import SpotifyCache
from services.spotify.dependencies import (
    get_oauth_transaction_store,
    get_spotify_cache,
)
from services.spotify.models import CurrentUser, SessionInfo, TokenInfo
from services.spotify.oauth import OAuthTransactionStore
from settings import Settings
from state import get_oauth, get_settings

router = APIRouter()
_OAUTH_BINDING_COOKIE = "oauth_binding"


@router.get("/login")
@limiter.limit("15/minute")
async def handle_login(
    request: Request,
    redirect_to: str = "/",
    browser_binding: str | None = Cookie(default=None, alias=_OAUTH_BINDING_COOKIE),
    oauth: SpotifyOAuthPKCE = Depends(get_oauth),
    transactions: OAuthTransactionStore = Depends(get_oauth_transaction_store),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """Provides the Spotify OAuth url for this application."""
    if not _is_valid_redirect_path(redirect_to):
        raise HTTPException(status_code=400, detail="Invalid redirect path.")

    attempt = await transactions.create(redirect_to, browser_binding)
    response = RedirectResponse(
        url=oauth.get_authorize_url(
            state=attempt.state,
            code_challenge=attempt.code_challenge,
        )
    )
    response.set_cookie(
        key=_OAUTH_BINDING_COOKIE,
        value=attempt.browser_binding,
        httponly=True,
        samesite="lax",
        max_age=settings.ttl_oauth_transactions,
        secure=not settings.debug,
    )
    return response


@router.get("/callback")
@limiter.limit("15/minute")
async def handle_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
    browser_binding: str | None = Cookie(default=None, alias=_OAUTH_BINDING_COOKIE),
    oauth: SpotifyOAuthPKCE = Depends(get_oauth),
    transactions: OAuthTransactionStore = Depends(get_oauth_transaction_store),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    """Exchanges the OAuth code for an access token and starts a new session."""

    def redirect_error() -> RedirectResponse:
        params = urlencode({"error": "login_failed"})
        response = RedirectResponse(f"{settings.frontend_url}/request-access?{params}")
        _clear_oauth_binding_cookie(response, settings)
        return response

    try:
        transaction = await transactions.consume(state, browser_binding)
    except (BinasciiError, InvalidTag, RedisError, UnicodeError, ValidationError):
        return redirect_error()

    if error or not code or transaction is None:
        return redirect_error()

    try:
        token = await asyncio.to_thread(
            oauth.exchange_code,
            code,
            transaction.code_verifier,
        )
        token_info = TokenInfo(**token)
        spotify = Spotify(auth=token_info.access_token)
        user = CurrentUser(**await asyncio.to_thread(spotify.current_user))

        session_info = SessionInfo(user_id=user.id, **token_info.model_dump())
        session_id = await cache.create_session(session_info)
    except Exception:
        return redirect_error()

    response = RedirectResponse(
        url=_build_redirect_url(settings.frontend_url, transaction.redirect_to)
    )
    _clear_oauth_binding_cookie(response, settings)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=settings.ttl_sessions,
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


def _clear_oauth_binding_cookie(response: RedirectResponse, settings: Settings) -> None:
    response.delete_cookie(
        key=_OAUTH_BINDING_COOKIE,
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
    )


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
