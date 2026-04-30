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
def handle_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: State = Depends(get_app_state),
) -> JSONResponse:
    """Handle OAuth callback from Spotify"""
    if error or not code:
        return JSONResponse({"message": "Authorization failed."}, status_code=401)

    token_info = TokenInfo(**state.oauth.get_access_token(code, check_cache=False))

    return JSONResponse({"message": "callback!"})


@router.delete("/")
def handle_logout() -> JSONResponse:
    return JSONResponse({"message": "Logged out successfully."})
