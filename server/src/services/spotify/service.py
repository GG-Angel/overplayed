import asyncio
from services.spotify.utils import build_liked_songs_playlist
from asyncio import Task, Future
from core.exceptions import NotFoundException
from typing import List, AsyncIterator
from services.spotify.client import SpotifyClient
from services.spotify.cache import SpotifyCache
from services.spotify.models import (
    CurrentUser,
    Playlist,
    PlaylistPage,
    PlaylistPageMetadata,
    PlaylistItem,
    LIKED_SONGS_ID,
)


class SpotifyService:
    def __init__(
        self,
        spotify: SpotifyClient,
        cache: SpotifyCache,
        user_id: str,
        background_tasks: set[Task],
    ):
        self.spotify = spotify
        self.cache = cache
        self.user_id = user_id
        self.background_tasks = background_tasks

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
        owned_playlists.append(
            build_liked_songs_playlist(
                user=await self.get_current_user(),
                total=await self.spotify.get_user_saved_tracks_total(),
            )
        )
        await self.cache.set_playlists(self.user_id, owned_playlists)
        return owned_playlists

    async def get_playlist(self, playlist_id: str) -> Playlist:
        if cached := await self.cache.get_playlist(self.user_id, playlist_id):
            return cached

        user_playlists = await self.get_user_playlists()
        playlist = next((p for p in user_playlists if p.id == playlist_id), None)
        if playlist is None:
            raise NotFoundException()
        return playlist

    async def get_playlist_items(
        self, playlist_id: str, *, offset: int = 0, limit: int = 100
    ) -> PlaylistPage:
        playlist = await self.get_playlist(playlist_id)
        if playlist.tracks.total == 0:
            return self._build_playlist_page([], offset, limit)

        cached = await self.cache.get_playlist_items(
            self.user_id,
            playlist_id,
            playlist.snapshot_id,
            offset=offset,
            limit=limit,
        )
        if cached is not None:
            return self._build_playlist_page(cached, offset, limit)

        page: List[PlaylistItem] = []
        page_ready = asyncio.Future()
        task = asyncio.create_task(
            self._fetch_and_cache_playlist_items(
                playlist, offset, limit, page, page_ready
            )
        )
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)

        await page_ready
        return self._build_playlist_page(page, offset, limit)

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

    def _build_playlist_page(
        self, items: List[PlaylistItem], offset: int, limit: int
    ) -> PlaylistPage:
        has_more = len(items) == limit
        return PlaylistPage(
            items=items,
            metadata=PlaylistPageMetadata(
                has_more=has_more,
                next_offset=offset + len(items) if has_more else None,
            ),
        )

    def _get_playlist_items_source(
        self, playlist_id: str
    ) -> AsyncIterator[PlaylistItem]:
        if playlist_id == LIKED_SONGS_ID:
            return self.spotify.get_saved_tracks()
        return self.spotify.get_unique_playlist_items(playlist_id)

    async def _fetch_and_cache_playlist_items(
        self,
        playlist: Playlist,
        offset: int,
        limit: int,
        page: List[PlaylistItem],
        page_ready: Future[None],
    ) -> None:
        batch: List[PlaylistItem] = []
        fetch_offset = 0
        async for item in self._get_playlist_items_source(playlist.id):
            batch.append(item)
            if offset <= fetch_offset < offset + limit:
                page.append(item)
            fetch_offset += 1

            if len(page) == limit and not page_ready.done():
                page_ready.set_result(None)

            if len(batch) >= self.spotify.playlist_items_limit:
                await self.cache.append_playlist_items(
                    self.user_id, playlist.id, playlist.snapshot_id, batch
                )
                batch = []

        if batch:
            await self.cache.append_playlist_items(
                self.user_id, playlist.id, playlist.snapshot_id, batch
            )
        if not page_ready.done():
            page_ready.set_result(None)
