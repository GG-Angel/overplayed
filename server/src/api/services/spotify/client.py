import asyncio
from core.config import SpotifySettings
from typing import List, Callable, AsyncGenerator
from loguru import logger
from spotipy import Spotify
from .utils import spotify_fields
from .models import CurrentUser, Playlist, PlaylistItem


class SpotifyClient:
    def __init__(self, spotify: Spotify, settings: SpotifySettings, user_id: str):
        self.spotify = spotify
        self.settings = settings
        self.user_id = user_id

    async def get_current_user(self) -> CurrentUser:
        """Gets the profile of the current user."""
        user = await self._run(self.spotify.me)
        return CurrentUser.model_validate(**user)

    async def get_playlist(self, playlist_id: str) -> Playlist:
        """Gets playlist metadata."""
        playlist = await self._run(
            self.spotify.playlist,
            playlist_id,
            fields=spotify_fields(Playlist),
        )
        self._log(f"Got playlist {playlist_id}")
        return Playlist(**playlist)

    async def get_user_playlists(self) -> List[Playlist]:
        """Gets all playlists saved by a user."""
        self._log("Getting user playlists")
        playlists = []
        async for p in self._paginate(
            self.spotify.current_user_playlists,
            limit=self.settings.playlist_limit,
        ):
            playlists.append(Playlist.model_validate(p))
        self._log(f"Got {len(playlists)} playlists")
        return playlists

    async def get_playlist_items(self, playlist_id: str) -> List[PlaylistItem]:
        """Gets all items from a playlist."""
        self._log(f"Getting items from playlist {playlist_id}")

        items = []
        async for item in self._paginate(
            self.spotify.playlist_items,
            limit=self.settings.playlist_items_limit,
            playlist_id=playlist_id,
            fields=spotify_fields(PlaylistItem, is_nested=True),
        ):
            if item.get("track") and not item.get("is_local"):
                items.append(PlaylistItem.model_validate(item))

        self._log(f"Got {len(items)} items from playlist {playlist_id}")
        return items

    async def get_unique_playlist_items(self, playlist_id: str) -> List[PlaylistItem]:
        items = await self.get_playlist_items(playlist_id)
        seen = set()
        deduped = []

        self._log(f"Deduping {len(items)} from playlist {playlist_id}")
        for item in items:
            if item.track.uri not in seen:
                seen.add(item.track.uri)
                deduped.append(item)

        self._log(f"Got {len(deduped)} unique items from playlist {playlist_id}")
        return deduped

    async def remove_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        """Removes all occurrences of items from a playlist."""
        for offset in range(0, len(uris), self.settings.playlist_items_limit):
            self._log(f"Removing items from playlist {playlist_id} (offset={offset})")
            await self._run(
                self.spotify.playlist_remove_all_occurrences_of_items,
                playlist_id=playlist_id,
                items=uris[offset : offset + self.settings.playlist_items_limit],
            )
        self._log(f"Removed {len(uris)} items from playlist {playlist_id}")

    async def add_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        """Appends items to an existing playlist."""
        for offset in range(0, len(uris), self.settings.playlist_items_limit):
            self._log(f"Adding items to playlist {playlist_id} (offset={offset})")
            await self._run(
                self.spotify.playlist_add_items,
                playlist_id,
                uris[offset : offset + self.settings.playlist_items_limit],
            )
        self._log(f"Added {len(uris)} items to playlist {playlist_id}")

    async def create_playlist(self, name: str, description: str) -> Playlist:
        """Creates a new empty playlist."""
        playlist = Playlist.model_validate(
            await self._run(
                self.spotify.current_user_playlist_create,
                name=name,
                description=description,
                public=False,
            )
        )
        self._log(f"Created playlist {playlist.id}")
        return playlist

    async def delete_playlist(self, playlist_id: str) -> None:
        """Deletes a playlist."""
        await self._run(self.spotify.current_user_unfollow_playlist, playlist_id)
        self._log(f"Deleted playlist {playlist_id}")

    async def _paginate(
        self, method: Callable, limit: int, **kwargs
    ) -> AsyncGenerator[dict]:
        """Paginate a Spotify endpoint."""
        method_name = getattr(method, "__name__", repr(method))
        offset = 0

        # TODO: add limit?
        while True:
            self._log(f"Paginating {method_name} (offset={offset})")
            response = await self._run(method, offset=offset, limit=limit, **kwargs)

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
        logger.debug(f"[{self.user_id}] {message}")
