from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from app.dependencies import create_spotify_oauth

router = APIRouter()


@router.get("/login")
def login(request: Request):
    sp_oauth = create_spotify_oauth(request)
    auth_url = sp_oauth.get_authorize_url()
    return RedirectResponse(auth_url)


@router.get("/callback")
def callback(request: Request):
    sp_oauth = create_spotify_oauth(request)
    request.session.clear()
    code = request.query_params.get("code")
    token_info = sp_oauth.get_access_token(code)
    request.session["token_info"] = token_info
    return RedirectResponse(url="/")
