from contextlib import asynccontextmanager
from settings import SpotifySettings
from typing import List, Callable, AsyncIterator
from loguru import logger
import asyncio
from models import SpotifyCurrentUser, SpotifyPlaylist, SpotifyPlaylistTrack
from spotipy import Spotify, SpotifyException
from spotify.utils import spotify_fields


class SpotifyClient:
    def __init__(self, spotify: Spotify, settings: SpotifySettings, user_id: str):
        self.spotify = spotify
        self.settings = settings
        self.user_id = user_id

    async def get_user(self) -> SpotifyCurrentUser:
        """Gets the profile of the current user."""
        user = await asyncio.to_thread(self.spotify.current_user)
        return SpotifyCurrentUser(**user)

    async def get_playlist(self, playlist_id: str) -> SpotifyPlaylist:
        """Gets playlist metadata."""
        async with self.error_handler(f"Couldn't fetch playlist {playlist_id}"):
            playlist = await asyncio.to_thread(
                self.spotify.playlist,
                playlist_id=playlist_id,
                fields=spotify_fields(SpotifyPlaylist),
            )
        logger.info(f"[{self.user_id}] Fetched playlist: {playlist_id}")
        return SpotifyPlaylist(**playlist)

    async def get_user_playlists(self) -> List[SpotifyPlaylist]:
        """Gets all playlists saved by a user."""
        logger.info(f"[{self.user_id}] Fetching playlists")
        error_msg = f"Couldn't fetch playlists for user {self.user_id}"
        async with self.error_handler(error_msg):
            playlists = [
                SpotifyPlaylist(**p)
                async for p in self.get_paginated_items(
                    self.spotify.current_user_playlists,
                    limit=self.settings.lim_playlists,
                )
            ]
        logger.info(f"[{self.user_id}] Fetched {len(playlists)} playlists")
        return playlists

    async def get_playlist_tracks(self, playlist_id: str) -> List[SpotifyPlaylistTrack]:
        """Gets all tracks from a playlist."""
        logger.info(f"[{self.user_id}] Fetching tracks: {playlist_id}")
        error_msg = f"Couldn't fetch tracks from playlist {playlist_id}"
        async with self.error_handler(error_msg):
            tracks = [
                SpotifyPlaylistTrack(**t)
                async for t in self.get_paginated_items(
                    self.spotify.playlist_items,
                    limit=self.settings.lim_tracks,
                    playlist_id=playlist_id,
                    fields=spotify_fields(SpotifyPlaylistTrack, is_nested=True),
                )
                if not t.get("is_local") and t.get("track") and t["track"].get("id")
            ]
        logger.info(f"[{self.user_id}] Fetched {len(tracks)} tracks: {playlist_id}")
        return tracks

    async def get_paginated_items(
        self, spotify_method: Callable, limit: int, **kwargs
    ) -> AsyncIterator[dict]:
        offset = 0
        while True:
            logger.debug(f"[{self.user_id}] Paginating {getattr(spotify_method, '__name__', repr(spotify_method))} offset={offset}")  # fmt: skip
            response = await asyncio.to_thread(spotify_method, offset=offset, limit=limit, **kwargs)  # fmt: skip
            items = response["items"]
            for item in items:
                yield item

            if len(items) < limit:
                break
            offset += limit

    @asynccontextmanager
    async def error_handler(self, message: str):
        try:
            yield
        except SpotifyException as e:
            logger.error(f"{message}: {e}")
            raise

    # TODO: delete tracks, create playlist, add tracks to playlist
