from secrets import token_urlsafe
from loguru import logger
from redis import RedisError
from spotipy import SpotifyOauthError
from utils import get_app_state
from models import TokenInfo
from typing import Optional
from state import State
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/")
def handle_login(state: State = Depends(get_app_state)) -> JSONResponse:
    """Redirect user to the Spotify OAuth page"""
    return JSONResponse({"url": state.oauth.get_authorize_url()})


@router.get("/callback")
async def handle_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: State = Depends(get_app_state),
) -> JSONResponse:
    """Handle OAuth callback from Spotify"""
    fail_response = JSONResponse({"message": "Authorization failed."}, status_code=401)
    if error or not code:
        return fail_response

    # exchange code for access token
    try:
        token_info = TokenInfo(**state.oauth.get_access_token(code, check_cache=False))
    except SpotifyOauthError:
        return fail_response

    # generate session for this user
    try:
        session_id = token_urlsafe(32)
        redis = state.redis()
        await redis.set(
            f"sessions:{session_id}",
            token_info.model_dump_json(),
            ex=state.settings.redis.ttl_tokens,
        )
    except RedisError as e:
        logger.exception(f"Failed to cache token: {e}")
        return fail_response

    # set session id cookie for future spotify requests
    response = JSONResponse({"message": "Authorization successful."}, status_code=200)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=state.settings.is_production,
        samesite="lax",
        max_age=state.settings.redis.ttl_tokens,
    )
    return response


@router.delete("/")
def handle_logout() -> JSONResponse:
    return JSONResponse({"message": "Logged out successfully."})
