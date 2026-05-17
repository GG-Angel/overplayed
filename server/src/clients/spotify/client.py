import asyncio
from contextlib import asynccontextmanager
from settings import SpotifySettings
from typing import List, Callable, AsyncGenerator, AsyncIterator
from loguru import logger
from models import CurrentUser, Playlist, PlaylistItem
from spotipy import Spotify, SpotifyException
from clients.spotify.utils import spotify_fields


class SpotifyClient:
    def __init__(self, spotify: Spotify, settings: SpotifySettings, user_id: str):
        self.spotify = spotify
        self.settings = settings
        self.user_id = user_id

    async def get_user(self) -> CurrentUser:
        """Gets the profile of the current user."""
        async with self._handle_error("get current user"):
            user = await self._run(self.spotify.me)
            return CurrentUser(**user)

    async def get_playlist(self, playlist_id: str) -> Playlist:
        """Gets playlist metadata."""
        async with self._handle_error("get playlist"):
            playlist = await self._run(
                self.spotify.playlist,
                playlist_id=playlist_id,
                fields=spotify_fields(Playlist),
            )
            self._log(f"Got playlist: {playlist_id}")
            return Playlist(**playlist)

    async def get_user_playlists(self) -> List[Playlist]:
        """Gets all playlists saved by a user."""
        async with self._handle_error("get user playlists"):
            self._log("Getting user playlists")
            playlists = [
                Playlist(**p)
                async for p in self._paginate(
                    self.spotify.current_user_playlists,
                    limit=self.settings.lim_playlists,
                )
            ]
            self._log(f"Got {len(playlists)} playlists")
            return playlists

    async def get_playlist_items(self, playlist_id: str) -> List[PlaylistItem]:
        """Gets all items from a playlist."""
        async with self._handle_error("get items from playlist"):
            self._log(f"Getting items from playlist: {playlist_id}")
            items = [
                PlaylistItem(**t)
                async for t in self._paginate(
                    self.spotify.playlist_items,
                    limit=self.settings.lim_playlist_items,
                    playlist_id=playlist_id,
                    fields=spotify_fields(PlaylistItem, is_nested=True),
                )
                if not t.get("is_local") and t.get("track")
            ]
            self._log(f"Got {len(items)} items from playlist: {playlist_id}")
            return items

    async def remove_playlist_items(
        self, playlist_id: str, snapshot_id: str, item_uris: List[str]
    ) -> None:
        """Removes items from a playlist and returns the new snapshot ID."""
        async with self._handle_error("remove items from playlist"):
            last_snapshot_id = snapshot_id
            for offset in range(0, len(item_uris), self.settings.lim_playlist_items):
                batch = item_uris[offset : offset + self.settings.lim_playlist_items]
                self._log(
                    f"Removing items from playlist: {playlist_id} (offset={offset})"
                )
                last_snapshot_id = await self._run(
                    self.spotify.playlist_remove_all_occurrences_of_items,
                    playlist_id=playlist_id,
                    items=batch,
                    snapshot_id=last_snapshot_id,
                )
            self._log(f"Removed {len(item_uris)} items from playlist: {playlist_id}")

    async def create_playlist(self, name: str, description: str = "") -> Playlist:
        """Creates a new empty playlist."""
        async with self._handle_error("create playlist"):
            playlist = await self._run(
                self.spotify.user_playlist_create,
                user=self.user_id,
                name=name,
                description=description,
                public=False,
                collaborative=False,
            )
            self._log(f"Created playlist: '{name}'")
            return Playlist(**playlist)

    async def add_playlist_items(self, playlist_id: str, item_uris: List[str]) -> None:
        """Appends items to an existing playlist in batches."""
        async with self._handle_error("add items to playlist"):
            for offset in range(0, len(item_uris), self.settings.lim_playlist_items):
                batch = item_uris[offset : offset + self.settings.lim_playlist_items]
                self._log(f"Adding items to playlist: {playlist_id} (offset={offset})")
                await self._run(self.spotify.playlist_add_items, playlist_id, batch)
            self._log(f"Added {len(item_uris)} items to playlist: {playlist_id}")

    async def delete_playlist(self, playlist_id: str) -> None:
        """Deletes a playlist."""
        async with self._handle_error("delete playlist"):
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

    @asynccontextmanager
    async def _handle_error(self, operation: str) -> AsyncIterator[None]:
        try:
            yield
        except SpotifyException as e:
            logger.error(f"[{self.user_id}] Failed to {operation}: {e}")
            raise
