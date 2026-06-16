import asyncio
from asyncio import Task
from core.exceptions import NotFoundException
from typing import List
from services.spotify.client import SpotifyClient
from services.spotify.cache import SpotifyCache
from services.spotify.models import (
    CurrentUser,
    Playlist,
    PlaylistPage,
    PlaylistPageMetadata,
    PlaylistItem,
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

        # TODO: hold background tasks in state
        self._background_tasks: set[Task] = set()

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
                metadata=PlaylistPageMetadata(has_more=False, next_offset=None),
            )

        # TODO: raise exception when offset exceeds playlist size?

        # TODO: raise not ready exception when another request tries to get items from the same playlist
        # create a status object in the cache that stores the current amount fetched and loading|complete status
        # if loading and offset > amount_fetched: raise NOT READY
        # cache get playlist items should return both pieces of data atomically to avoid TOCTOU

        cached = await self.cache.get_playlist_items(
            self.user_id,
            playlist_id,
            playlist.snapshot_id,
            offset=offset,
            limit=limit,
        )
        if cached is not None:
            next_offset = offset + len(cached)
            has_more = next_offset < playlist.tracks.total
            return PlaylistPage(
                items=cached,
                metadata=PlaylistPageMetadata(
                    has_more=has_more,
                    next_offset=next_offset if has_more else None,
                ),
            )

        # cache miss
        page: List[PlaylistItem] = []
        page_ready = asyncio.Future()

        async def fetch_page_and_cache_rest() -> None:
            batch: List[PlaylistItem] = []
            fetch_offset = 0
            async for item in self.spotify.get_unique_playlist_items(playlist_id):
                batch.append(item)
                if offset <= fetch_offset < offset + limit:
                    page.append(item)
                fetch_offset += 1

                if len(page) == limit and not page_ready.done():
                    page_ready.set_result(None)

                if len(batch) >= self.spotify.playlist_items_limit:
                    await self.cache.append_playlist_items(
                        self.user_id, playlist_id, playlist.snapshot_id, batch
                    )
                    batch = []
            if batch:
                await self.cache.append_playlist_items(
                    self.user_id, playlist_id, playlist.snapshot_id, batch
                )
            if not page_ready.done():
                page_ready.set_result(None)

        task = asyncio.create_task(fetch_page_and_cache_rest())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)

        # wait for the page we want
        await page_ready

        next_offset = offset + len(page)
        has_more = next_offset < playlist.tracks.total
        return PlaylistPage(
            items=page,
            metadata=PlaylistPageMetadata(
                has_more=has_more,
                next_offset=next_offset if has_more else None,
            ),
        )

    async def create_playlist(self, name: str, description: str) -> Playlist:
        new_playlist = await self.spotify.create_playlist(name, description)
        await self._invalidate_playlists()
        return new_playlist

    async def add_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        await self.spotify.add_playlist_items(playlist_id, uris)
        await self._invalidate_playlists()

    async def delete_playlist_items(self, playlist_id: str, uris: List[str]) -> None:
        await self.spotify.remove_playlist_items(playlist_id, uris)
        await self._invalidate_playlists()

    async def delete_playlist(self, playlist_id: str) -> None:
        await self.spotify.delete_playlist(playlist_id)
        await self._invalidate_playlists()

    async def _invalidate_playlists(self) -> None:
        await self.cache.invalidate_playlists(self.user_id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
