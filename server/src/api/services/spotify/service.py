from core.exceptions import NotFoundException
from typing import List
from .client import SpotifyClient
from .cache import SpotifyCache
from .models import CurrentUser, Playlist, PlaylistItems
from .utils import get_formatted_date


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

    async def get_current_user(self) -> CurrentUser:
        if cached := await self.cache.get_user(self.user_id):
            return cached

        user = await self.spotify.get_current_user()
        await self.cache.set_user(user)

        return user

    async def get_playlist(self, playlist_id: str) -> Playlist:
        if cached := await self.cache.get_playlist(self.user_id, playlist_id):
            return cached

        playlists = await self.get_user_playlists()
        playlist = next((p for p in playlists if p.id == playlist_id), None)
        if playlist is None:
            raise NotFoundException()

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

        if cached := await self.cache.get_playlist_items(
            self.user_id,
            playlist_id,
            playlist.snapshot_id,
            offset=offset,
            limit=limit,
        ):
            return cached

        items = await self.spotify.get_unique_playlist_items(playlist_id)
        await self.cache.set_playlist_items(
            self.user_id, playlist_id, playlist.id, items
        )

        return PlaylistItems(
            items=items[offset : offset + limit],
            total=len(items),
            has_more=offset + limit < len(items),
        )

    async def create_playlist(self) -> Playlist:
        playlist = await self.spotify.create_playlist(
            name="Overplayed", description=f"Generated on {get_formatted_date()}"
        )
        await self.cache.invalidate_playlists(self.user_id)
        return playlist

    async def add_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        playlist = await self.get_playlist(playlist_id)  # verifies owner
        await self.spotify.add_playlist_items(playlist.id, uris)
        await self.cache.invalidate_playlist(self.user_id, playlist.id)

    async def delete_playlist_items(
        self, playlist_id: str, item_uris: List[str]
    ) -> None:
        playlist = await self.get_playlist(playlist_id)
        await self.spotify.remove_playlist_items(playlist.id, item_uris)
        await self.cache.invalidate_playlist(self.user_id, playlist.id)

    async def delete_playlist(self, playlist_id: str) -> None:
        playlist = await self.get_playlist(playlist_id)
        await self.spotify.delete_playlist(playlist.id)
        await self.cache.invalidate_playlist(self.user_id, playlist.id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
