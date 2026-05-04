import functools
import asyncio
from settings import SpotifySettings
from typing import List, Callable, AsyncGenerator
from loguru import logger
from models import SpotifyCurrentUser, SpotifyPlaylist, SpotifyPlaylistTrack
from spotipy import Spotify, SpotifyException
from clients.spotify.utils import spotify_fields


def spotify_error_handler(message: str):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(self, *args, **kwargs):
            try:
                return await func(self, *args, **kwargs)
            except SpotifyException as e:
                logger.error(f"[{self.user_id}] Failed to {message}: {e}")
                raise

        return wrapper

    return decorator


class SpotifyClient:
    def __init__(self, spotify: Spotify, settings: SpotifySettings, user_id: str):
        self.spotify = spotify
        self.settings = settings
        self.user_id = user_id

    @spotify_error_handler("get current user")
    async def get_user(self) -> SpotifyCurrentUser:
        """Gets the profile of the current user."""
        user = await self._run(self.spotify.me)
        return SpotifyCurrentUser(**user)

    @spotify_error_handler("get playlist")
    async def get_playlist(self, playlist_id: str) -> SpotifyPlaylist:
        """Gets playlist metadata."""
        playlist = await self._run(
            self.spotify.playlist,
            playlist_id=playlist_id,
            fields=spotify_fields(SpotifyPlaylist),
        )
        self._log(f"Got playlist: {playlist_id}")
        return SpotifyPlaylist(**playlist)

    @spotify_error_handler("get user playlists")
    async def get_user_playlists(self) -> List[SpotifyPlaylist]:
        """Gets all playlists saved by a user."""
        self._log("Getting user playlists")
        playlists = [
            SpotifyPlaylist(**p)
            async for p in self._paginate(
                self.spotify.current_user_playlists,
                limit=self.settings.lim_playlists,
            )
        ]
        self._log(f"Got {len(playlists)} playlists")
        return playlists

    @spotify_error_handler("get tracks from playlist")
    async def get_playlist_tracks(self, playlist_id: str) -> List[SpotifyPlaylistTrack]:
        """Gets all tracks from a playlist."""
        self._log(f"Getting tracks from playlist: {playlist_id}")
        tracks = [
            SpotifyPlaylistTrack(**t)
            async for t in self._paginate(
                self.spotify.playlist_items,
                limit=self.settings.lim_tracks,
                playlist_id=playlist_id,
                fields=spotify_fields(SpotifyPlaylistTrack, is_nested=True),
            )
            if not t.get("is_local") and t.get("track")
        ]
        self._log(f"Got {len(tracks)} tracks from playlist: {playlist_id}")
        return tracks

    @spotify_error_handler("remove tracks from playlist")
    async def remove_playlist_tracks(
        self, playlist_id: str, snapshot_id: str, track_uris: List[str]
    ) -> None:
        """Removes tracks from a playlist and returns the new snapshot ID."""
        last_snapshot_id = snapshot_id
        for offset in range(0, len(track_uris), self.settings.lim_tracks):
            batch = track_uris[offset : offset + self.settings.lim_tracks]
            self._log(f"Removing tracks from playlist: {playlist_id} (offset={offset})")
            last_snapshot_id = await self._run(
                self.spotify.playlist_remove_all_occurrences_of_items,
                playlist_id=playlist_id,
                items=batch,
                snapshot_id=last_snapshot_id,
            )
        self._log(f"Removed {len(track_uris)} tracks from playlist: {playlist_id}")

    @spotify_error_handler("create playlist")
    async def create_playlist(
        self, name: str, description: str = ""
    ) -> SpotifyPlaylist:
        """Creates a new empty playlist."""
        playlist = await self._run(
            self.spotify.user_playlist_create,
            user=self.user_id,
            name=name,
            description=description,
            public=False,
            collaborative=False,
        )
        self._log(f"Created playlist: '{name}'")
        return SpotifyPlaylist(**playlist)

    @spotify_error_handler("add tracks to playlist")
    async def add_playlist_tracks(
        self, playlist_id: str, track_uris: List[str]
    ) -> None:
        """Appends tracks to an existing playlist in batches."""
        for offset in range(0, len(track_uris), self.settings.lim_tracks):
            batch = track_uris[offset : offset + self.settings.lim_tracks]
            self._log(f"Adding tracks to playlist: {playlist_id} (offset={offset})")
            await self._run(self.spotify.playlist_add_items, playlist_id, batch)
        self._log(f"Added {len(track_uris)} tracks to playlist: {playlist_id}")

    @spotify_error_handler("delete playlist")
    async def delete_playlist(self, playlist_id: str) -> None:
        """Deletes a playlist."""
        await self._run(self.spotify.current_user_unfollow_playlist, playlist_id)
        self._log(f"Deleted playlist: {playlist_id}")

    async def _paginate(
        self, spotify_method: Callable, limit: int, **kwargs
    ) -> AsyncGenerator[dict, None]:
        """Paginate a Spotify endpoint."""
        label = getattr(spotify_method, "__name__", repr(spotify_method))
        offset = 0
        while True:
            logger.debug(f"[{self.user_id}] Paginating {label} (offset={offset})")
            response = await self._run(
                spotify_method, offset=offset, limit=limit, **kwargs
            )
            items = response["items"]
            for item in items:
                yield item

            if len(items) < limit:
                break
            offset += limit

    async def _run(self, func: Callable, *args, **kwargs):
        """Runs a blocking Spotipy call in a thread."""
        return await asyncio.to_thread(func, *args, **kwargs)

    def _log(self, message: str) -> None:
        """Log a message traced to the current user's ID."""
        logger.info(f"[{self.user_id}] {message}")
