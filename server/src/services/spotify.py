from utils import get_formatted_date
from typing import List
from clients import SpotifyClient
from cache import SpotifyCache
from models import (
    Playlist,
    CurrentUser,
    PlaylistItems,
)


class PlaylistNotOwnedError(Exception):
    pass


class SpotifyService:
    def __init__(
        self,
        spotify: SpotifyClient,
        cache: SpotifyCache,
        user_id: str,
    ):
        self.spotify = spotify
        self.cache = cache
        self.user_id = user_id

    async def get_user(self) -> CurrentUser:
        if cached := await self.cache.get_user(self.user_id):
            return cached

        user = await self.spotify.get_user()
        await self.cache.set_user(user)
        return user

    async def get_playlist(self, playlist_id: str) -> Playlist:
        if cached := await self.cache.get_playlist(self.user_id, playlist_id):
            return cached

        playlist = await self.spotify.get_playlist(playlist_id)
        if not self._is_playlist_owned(playlist):
            raise PlaylistNotOwnedError()

        return playlist

    async def get_user_playlists(self) -> List[Playlist]:
        if cached := await self.cache.get_playlists(self.user_id):
            return cached

        saved_playlists = await self.spotify.get_user_playlists()
        owned_playlists = [p for p in saved_playlists if self._is_playlist_owned(p)]
        await self.cache.set_playlists(self.user_id, owned_playlists)

        return owned_playlists

    async def get_playlist_items(
        self, playlist_id: str, *, offset: int, limit: int
    ) -> PlaylistItems:
        playlist = await self.get_playlist(playlist_id)

        if playlist.tracks.total <= 0:
            return PlaylistItems(items=[], total=0, has_more=False)

        current_snapshot_id = playlist.snapshot_id

        cached = await self.cache.get_playlist_items(
            self.user_id,
            playlist_id,
            current_snapshot_id,
            offset=offset,
            limit=limit,
        )

        if cached is not None:
            return cached

        items = await self.spotify.get_playlist_items(playlist_id)
        await self.cache.set_playlist_items(
            self.user_id,
            playlist_id,
            current_snapshot_id,
            items,
        )

        return PlaylistItems(
            items=items[offset : offset + limit],
            total=len(items),
            has_more=offset + limit < len(items),
        )

    async def create_playlist(self) -> Playlist:
        playlist = await self.spotify.create_playlist(
            name="Overplayed",
            description=f"Generated on {get_formatted_date()}",
        )
        await self.cache.invalidate_playlists(self.user_id)
        return playlist

    async def add_playlist_items(self, playlist_id: str, item_uris: List[str]) -> None:
        await self.get_playlist(playlist_id)  # verifies owner
        await self.spotify.add_playlist_items(playlist_id, item_uris)
        await self.cache.invalidate_playlist(self.user_id, playlist_id)

    async def delete_playlist_items(
        self, playlist_id: str, item_uris: List[str]
    ) -> None:
        playlist = await self.get_playlist(playlist_id)  # verifies owner
        await self.spotify.remove_playlist_items(
            playlist_id,
            playlist.snapshot_id,
            item_uris,
        )

        await self.cache.invalidate_playlist(self.user_id, playlist_id)

    async def delete_playlist(self, playlist_id: str) -> None:
        await self.spotify.delete_playlist(playlist_id)
        await self.cache.invalidate_playlist(self.user_id, playlist_id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
