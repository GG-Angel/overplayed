from core.exceptions import NotFoundException
from typing import List
from services.spotify.client import SpotifyClient
from services.spotify.cache import SpotifyCache
from services.spotify.models import (
    CurrentUser,
    Playlist,
    PlaylistPage,
    PlaylistPageMetadata,
)


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

    async def get_user_playlists(self) -> List[Playlist]:
        if cached := await self.cache.get_playlists(self.user_id):
            return cached

        saved_playlists = await self.spotify.get_user_playlists()
        owned_playlists = [p for p in saved_playlists if self._is_playlist_owned(p)]
        await self.cache.set_playlists(self.user_id, owned_playlists)

        return owned_playlists

    async def get_playlist(self, playlist_id: str) -> Playlist:
        if cached := await self.cache.get_playlist(self.user_id, playlist_id):
            return cached

        playlists = await self.get_user_playlists()
        playlist = next((p for p in playlists if p.id == playlist_id), None)
        if playlist is None:
            raise NotFoundException()

        return playlist

    async def get_playlist_items(
        self, playlist_id: str, *, offset: int = 0, limit: int = 100
    ) -> PlaylistPage:
        playlist = await self.get_playlist(playlist_id)

        if playlist.tracks.total == 0:
            return PlaylistPage(
                items=[],
                metadata=PlaylistPageMetadata(
                    total_items=0,
                    has_more=False,
                    next_offset=None,
                ),
            )

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
            self.user_id, playlist.id, playlist.snapshot_id, items
        )

        page = items[offset : offset + limit]
        has_more = offset + len(page) < len(items)

        return PlaylistPage(
            items=page,
            metadata=PlaylistPageMetadata(
                total_items=len(items),
                has_more=has_more,
                next_offset=offset + len(page) if has_more else None,
            ),
        )

    async def create_playlist(self, name: str, description: str) -> Playlist:
        new_playlist = await self.spotify.create_playlist(name, description)
        await self.cache.invalidate_playlists(self.user_id)
        return new_playlist

    async def add_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        await self.spotify.add_playlist_items(playlist_id, uris)
        await self.cache.invalidate_playlist(self.user_id, playlist_id)

    async def delete_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        await self.spotify.remove_playlist_items(playlist_id, uris)
        await self.cache.invalidate_playlist(self.user_id, playlist_id)

    async def delete_playlist(self, playlist_id: str) -> None:
        await self.spotify.delete_playlist(playlist_id)
        await self.cache.invalidate_playlist(self.user_id, playlist_id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
