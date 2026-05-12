from typing import List
from models import (
    Playlist,
    CurrentUser,
    PlaylistItems,
)
from cache.client import RedisClient
from clients.spotify.client import SpotifyClient


class PlaylistNotOwnedError(Exception):
    pass


class SpotifyService:
    def __init__(self, spotify: SpotifyClient, redis: RedisClient, user_id: str):
        self.spotify = spotify
        self.redis = redis
        self.user_id = user_id

    async def get_user(self) -> CurrentUser:
        user = await self.redis.get_user(self.user_id)
        if not user:
            user = await self.spotify.get_user()
            await self.redis.set_user(user)
        return user

    async def get_playlist(self, playlist_id: str) -> Playlist:
        if cached := await self.redis.get_playlist(self.user_id, playlist_id):
            return cached

        playlist = await self.spotify.get_playlist(playlist_id)
        if not self._is_playlist_owned(playlist):
            raise PlaylistNotOwnedError()

        await self.redis.set_playlist(self.user_id, playlist)
        return playlist

    async def get_user_playlists(self) -> List[Playlist]:
        if cached := await self.redis.get_playlists(self.user_id):
            return cached

        playlists = await self.spotify.get_user_playlists()
        owned = [p for p in playlists if self._is_playlist_owned(p)]
        await self.redis.set_playlists(self.user_id, owned)
        return owned

    async def get_playlist_items(
        self, playlist_id: str, *, offset: int, limit: int
    ) -> PlaylistItems:
        playlist = await self.get_playlist(playlist_id)
        snapshot_id = playlist.snapshot_id

        if (
            cached := await self.redis.get_playlist_items(
                self.user_id, playlist_id, snapshot_id, offset=offset, limit=limit
            )
        ) is not None:
            return cached

        items = await self.spotify.get_playlist_items(playlist_id)
        await self.redis.set_playlist(self.user_id, playlist)
        await self.redis.set_playlist_items(
            self.user_id,
            playlist_id,
            snapshot_id,
            items,
        )

        return PlaylistItems(
            items=items[offset : offset + limit],
            total=len(items),
            has_more=offset + limit < len(items),
        )

    async def create_playlist(self, name: str, description: str = "") -> Playlist:
        playlist = await self.spotify.create_playlist(name, description)
        await self.redis.invalidate_playlists(self.user_id)
        return playlist

    async def add_playlist_items(self, playlist_id: str, item_uris: List[str]) -> None:
        await self.spotify.add_playlist_items(playlist_id, item_uris)
        await self.redis.invalidate_playlist(self.user_id, playlist_id)

    async def delete_playlist_items(
        self, playlist_id: str, item_uris: List[str]
    ) -> None:
        playlist = await self.get_playlist(playlist_id)
        await self.spotify.remove_playlist_items(
            playlist_id, playlist.snapshot_id, item_uris
        )
        await self.redis.invalidate_playlist(self.user_id, playlist_id)

    async def delete_playlist(self, playlist_id: str) -> None:
        await self.spotify.delete_playlist(playlist_id)
        await self.redis.invalidate_playlist(self.user_id, playlist_id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
