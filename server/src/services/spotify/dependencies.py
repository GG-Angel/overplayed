import asyncio
from time import time

from fastapi import Cookie, Depends
from spotipy import Spotify, SpotifyOAuth

from cache.client import RedisClient, get_redis_client
from core.exceptions import UnauthorizedException
from services.spotify.cache import SpotifyCache
from services.spotify.client import SpotifyClient
from services.spotify.models import SessionInfo, TokenInfo
from services.spotify.oauth import OAuthTransactionStore
from services.spotify.service import SpotifyService
from settings import Settings
from state import State, get_oauth, get_settings, get_state

TOKEN_EXPIRY_BUFFER = 120


def get_spotify_cache(
    redis: RedisClient = Depends(get_redis_client),
    settings: Settings = Depends(get_settings),
) -> SpotifyCache:
    return SpotifyCache(
        redis=redis,
        redis_key=settings.redis_key,
        ttl_sessions=settings.ttl_sessions,
        ttl_users=settings.ttl_users,
        ttl_playlists=settings.ttl_playlists,
        ttl_playlist_tracks=settings.ttl_playlist_tracks,
    )


def get_oauth_transaction_store(
    redis: RedisClient = Depends(get_redis_client),
    settings: Settings = Depends(get_settings),
) -> OAuthTransactionStore:
    return OAuthTransactionStore(
        redis=redis,
        redis_key=settings.redis_key,
        ttl=settings.ttl_oauth_transactions,
    )


async def get_spotify_service(
    session_id: str | None = Cookie(default=None),
    state: State = Depends(get_state),
    oauth: SpotifyOAuth = Depends(get_oauth),
    cache: SpotifyCache = Depends(get_spotify_cache),
    settings: Settings = Depends(get_settings),
) -> SpotifyService:
    if not session_id or not (session := await cache.get_session(session_id)):
        raise UnauthorizedException()

    if _is_token_expired(session.expires_at):
        new_token = await _refresh_token(oauth, session)
        session = SessionInfo(user_id=session.user_id, **new_token.model_dump())
        await cache.set_session(session_id, session)

    return SpotifyService(
        spotify=SpotifyClient(
            spotify=Spotify(auth=session.access_token),
            user_id=session.user_id,
            playlist_limit=settings.playlist_limit,
            playlist_tracks_limit=settings.playlist_tracks_limit,
            get_saved_tracks_limit=settings.get_saved_tracks_limit,
            edit_saved_tracks_limit=settings.edit_saved_tracks_limit,
            max_pagination_offset=settings.max_pagination_offset,
        ),
        cache=cache,
        user_id=session.user_id,
        background_tasks=state.background_tasks,
        track_streams=state.track_streams,
    )


def _is_token_expired(expires_at: int) -> bool:
    return expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def _refresh_token(oauth: SpotifyOAuth, token: SessionInfo) -> TokenInfo:
    refreshed = await asyncio.to_thread(oauth.refresh_access_token, token.refresh_token)
    return TokenInfo(**refreshed)
