import asyncio
from services.spotify.utils import build_liked_songs_playlist
from asyncio import Task, Future, Lock
from core.exceptions import NotFoundException, NotReadyException
from typing import List
from services.spotify.client import SpotifyClient
from services.spotify.cache import SpotifyCache
from services.spotify.models import (
    CurrentUser,
    Playlist,
    PlaylistPage,
    LIKED_SONGS_ID,
    Track,
)


class SpotifyService:
    def __init__(
        self,
        spotify: SpotifyClient,
        cache: SpotifyCache,
        user_id: str,
        background_tasks: set[Task],
        playlist_locks: dict[tuple[str, str], Lock],
    ):
        self.spotify = spotify
        self.cache = cache
        self.user_id = user_id
        self.background_tasks = background_tasks
        self.playlist_locks = playlist_locks

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
                total=await self.spotify.get_saved_tracks_total(),
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

    async def get_playlist_tracks(
        self, playlist_id: str, *, offset: int = 0, limit: int = 100
    ) -> PlaylistPage:
        playlist = await self.get_playlist(playlist_id)
        if playlist.tracks.total == 0:
            return self._build_playlist_page([], offset, limit)

        cached = await self.cache.get_playlist_tracks(
            self.user_id, playlist_id, playlist.snapshot_id, offset, limit
        )
        if cached is not None:
            return self._build_playlist_page(cached, offset, limit)

        lock = self.playlist_locks.setdefault(
            (playlist.id, playlist.snapshot_id),
            Lock(),
        )

        if lock.locked():
            raise NotReadyException()
        await lock.acquire()

        try:
            page: List[Track] = []
            page_ready: Future[None] = asyncio.Future()
            task = asyncio.create_task(
                self._fetch_and_cache_playlist_tracks(
                    playlist, offset, limit, page, page_ready
                )
            )
            self.background_tasks.add(task)
            task.add_done_callback(self.background_tasks.discard)
            await page_ready
            return self._build_playlist_page(page, offset, limit)
        finally:
            lock.release()

    async def _fetch_and_cache_playlist_tracks(
        self,
        playlist: Playlist,
        offset: int,
        limit: int,
        page: List[Track],
        page_ready: Future[None],
    ) -> None:
        if playlist.id == LIKED_SONGS_ID:
            tracks = self.spotify.get_saved_tracks()
        else:
            tracks = self.spotify.get_playlist_tracks(playlist.id)

        try:
            batch: List[Track] = []
            current_offset = 0
            async for track in tracks:
                batch.append(track)
                if offset <= current_offset < offset + limit:
                    page.append(track)
                current_offset += 1

                if len(page) == limit and not page_ready.done():
                    page_ready.set_result(None)

                if len(batch) >= self.spotify.playlist_tracks_limit:
                    await self.cache.push_playlist_tracks(
                        self.user_id, playlist.id, playlist.snapshot_id, batch
                    )
                    batch = []

            if batch:
                await self.cache.push_playlist_tracks(
                    self.user_id, playlist.id, playlist.snapshot_id, batch
                )
            if not page_ready.done():
                page_ready.set_result(None)
        except Exception as e:
            if not page_ready.done():
                page_ready.set_exception(e)
            else:
                raise

    async def create_playlist(self, name: str, description: str) -> Playlist:
        new_playlist = await self.spotify.create_playlist(name, description)
        await self._invalidate_playlists()
        return new_playlist

    async def add_playlist_tracks(self, playlist_id: str, uris: List[str]) -> None:
        await self.spotify.add_playlist_tracks(playlist_id, uris)
        await self._invalidate_playlists()

    async def remove_playlist_tracks(self, playlist_id: str, uris: List[str]) -> None:
        if playlist_id == LIKED_SONGS_ID:
            await self.spotify.remove_saved_tracks(uris)
        else:
            await self.spotify.remove_playlist_tracks(playlist_id, uris)
        await self._invalidate_playlists()

    async def _invalidate_playlists(self) -> None:
        await self.cache.invalidate_playlists(self.user_id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative

    def _build_playlist_page(
        self, tracks: List[Track], offset: int, limit: int
    ) -> PlaylistPage:
        has_more = len(tracks) == limit
        return PlaylistPage(
            tracks=tracks,
            has_more=has_more,
            next_offset=offset + len(tracks) if has_more else None,
        )
