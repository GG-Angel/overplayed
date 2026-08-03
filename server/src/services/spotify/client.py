import asyncio
from collections.abc import AsyncGenerator, AsyncIterator, Callable

from loguru import logger
from spotipy import Spotify

from services.spotify.models import CurrentUser, Playlist, Track
from services.spotify.utils import spotify_fields


class SpotifyClient:
    def __init__(
        self,
        spotify: Spotify,
        user_id: str,
        *,
        playlist_limit: int,
        playlist_tracks_limit: int,
        get_saved_tracks_limit: int,
        edit_saved_tracks_limit: int,
    ):
        self.spotify = spotify
        self.user_id = user_id
        self.playlist_limit = playlist_limit
        self.playlist_tracks_limit = playlist_tracks_limit
        self.get_saved_tracks_limit = get_saved_tracks_limit
        self.edit_saved_tracks_limit = edit_saved_tracks_limit

    async def get_current_user(self) -> CurrentUser:
        """Gets the profile of the current user."""
        user = await self._run(self.spotify.me)
        return CurrentUser.model_validate(user)

    async def get_playlist(self, playlist_id: str) -> Playlist:
        """Gets playlist metadata."""
        playlist = await self._run(
            self.spotify.playlist,
            playlist_id,
            fields=spotify_fields(Playlist),
        )
        self._log(f"Got playlist {playlist_id}")
        return Playlist(**playlist)

    async def get_user_playlists(self) -> list[Playlist]:
        """Gets all playlists saved by a user."""
        self._log("Getting user playlists")
        playlists = []
        async for playlist in self._get_paginated_user_playlists():
            playlists.append(playlist)
        self._log(f"Got {len(playlists)} playlists")
        return playlists

    async def get_saved_tracks_total(self) -> int:
        """Gets the user's total saved tracks."""
        response = await self._run(self.spotify.current_user_saved_tracks, limit=1)
        return response["total"]

    async def get_saved_tracks(self) -> AsyncIterator[Track]:
        """Yields a user's saved tracks as they're received."""
        self._log(f"Getting saved tracks for user {self.user_id}")
        async for track in self._get_paginated_tracks(
            self.spotify.current_user_saved_tracks,
            limit=self.get_saved_tracks_limit,
        ):
            yield track

    async def get_playlist_tracks(self, playlist_id: str) -> AsyncIterator[Track]:
        """Yields unique tracks from a playlist as they're received."""
        self._log(f"Getting tracks from playlist {playlist_id}")
        seen = set()
        async for track in self._get_paginated_tracks(
            self.spotify.playlist_items,
            limit=self.playlist_tracks_limit,
            playlist_id=playlist_id,
        ):
            if track.id not in seen:
                seen.add(track.id)
                yield track

    async def remove_playlist_tracks(self, playlist_id: str, uris: list[str]) -> None:
        """Removes all occurrences of tracks from a playlist."""
        for offset in range(0, len(uris), self.playlist_tracks_limit):
            self._log(f"Removing tracks from playlist {playlist_id} (offset={offset})")
            await self._run(
                self.spotify.playlist_remove_all_occurrences_of_items,
                playlist_id=playlist_id,
                items=uris[offset : offset + self.playlist_tracks_limit],
            )
        self._log(f"Removed {len(uris)} tracks from playlist {playlist_id}")

    async def remove_saved_tracks(self, uris: list[str]) -> None:
        """Removes all occurrences of tracks from a playlist."""
        for offset in range(0, len(uris), self.edit_saved_tracks_limit):
            self._log(f"Removing saved tracks (offset={offset})")
            await self._run(
                self.spotify.current_user_saved_tracks_delete,
                tracks=uris[offset : offset + self.edit_saved_tracks_limit],
            )
        self._log(f"Removed {len(uris)} saved tracks")

    async def add_playlist_tracks(self, playlist_id: str, uris: list[str]) -> None:
        """Appends items to an existing playlist."""
        for offset in range(0, len(uris), self.playlist_tracks_limit):
            self._log(f"Adding items to playlist {playlist_id} (offset={offset})")
            await self._run(
                self.spotify.playlist_add_items,
                playlist_id,
                uris[offset : offset + self.playlist_tracks_limit],
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

    async def _get_paginated_user_playlists(self) -> AsyncGenerator[Playlist]:
        async for playlist in self._paginate(
            self.spotify.current_user_playlists,
            limit=self.playlist_limit,
        ):
            yield Playlist.model_validate(playlist)

    async def _get_paginated_tracks(
        self, fn: Callable, limit: int, **kwargs
    ) -> AsyncGenerator[Track]:
        async for item in self._paginate(fn, limit=limit, **kwargs):
            if (
                isinstance(item, dict)
                and "track" in item
                and not item.get("is_local", False)
            ):
                yield Track.model_validate(item["track"])

    async def _paginate(
        self, fn: Callable, limit: int, **kwargs
    ) -> AsyncGenerator[dict]:
        """Paginate a Spotify endpoint."""
        fn_name = getattr(fn, "__name__", repr(fn))
        offset = 0

        while offset < 10000:
            self._log(f"Paginating {fn_name} (offset={offset})")
            response = await self._run(fn, offset=offset, limit=limit, **kwargs)

            items = response["items"]
            for item in items:
                yield item

            if len(items) < limit:
                break
            offset += limit

    async def _run(self, fn: Callable, *args, **kwargs):
        return await asyncio.to_thread(fn, *args, **kwargs)

    def _log(self, message: str) -> None:
        logger.debug(f"[{self.user_id}] {message}")
