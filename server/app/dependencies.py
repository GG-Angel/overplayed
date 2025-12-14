import time
import spotipy
from fastapi import Request
from datetime import datetime

from spotipy.oauth2 import SpotifyOAuth
from app.core.config import config


def get_spotify_client(request: Request) -> spotipy.Spotify:
    token_info = _get_token_info(request)
    if _is_token_expired(token_info):
        token_info = _refresh_token(request, token_info)
    return spotipy.Spotify(auth=token_info["access_token"])


def get_spotify_oauth(request: Request) -> SpotifyOAuth:
    return SpotifyOAuth(
        client_id=config.sp_client_id,
        client_secret=config.sp_client_secret,
        redirect_uri=request.url_for("callback"),
        scope=config.sp_scope,
    )


def _get_token_info(request: Request):
    token_info = request.session.get("token_info", None)
    if not token_info:
        raise Exception("User not logged in")
    return token_info


def _is_token_expired(token_info: dict) -> bool:
    now = int(time.time())
    return token_info["expires_at"] - now < 60


def _refresh_token(request: Request, token_info: dict) -> dict:
    sp_oauth = get_spotify_oauth(request)
    return sp_oauth.refresh_access_token(token_info["refresh_token"])


def require(value, message: str):
    if value is None:
        raise ValueError(message)
    return value


def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%SZ")
