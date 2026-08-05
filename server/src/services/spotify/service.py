import asyncio
from asyncio import Task
from collections.abc import AsyncGenerator

from loguru import logger

from core.exceptions import NotFoundException
from services.spotify.cache import SpotifyCache
from services.spotify.client import SpotifyClient
from services.spotify.models import (
    LIKED_SONGS_ID,
    CurrentUser,
    Playlist,
    Track,
)
from services.spotify.stream import TrackStream, TrackStreamKey
from services.spotify.utils import build_liked_songs_playlist

TRACK_PUBLISH_BATCH = 100


class SpotifyService:
    def __init__(
        self,
        spotify: SpotifyClient,
        cache: SpotifyCache,
        user_id: str,
        background_tasks: set[Task],
        track_streams: dict[TrackStreamKey, TrackStream],
    ):
        self.spotify = spotify
        self.cache = cache
        self.user_id = user_id
        self.background_tasks = background_tasks
        self.track_streams = track_streams

    async def get_current_user(self) -> CurrentUser:
        if cached := await self.cache.get_user(self.user_id):
            return cached

        user = await self.spotify.get_current_user()
        await self.cache.set_user(user)
        return user

    async def get_user_playlists(self) -> list[Playlist]:
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

    async def get_playlist_tracks(self, playlist_id: str) -> AsyncGenerator[Track]:
        playlist = await self.get_playlist(playlist_id)

        cached = await self.cache.get_playlist_tracks(
            self.user_id,
            playlist.id,
            playlist.snapshot_id,
        )

        if cached is not None:
            for track in cached:
                yield track
            return

        async for track in self._follow_track_stream(playlist).follow():
            yield track

    def _follow_track_stream(self, playlist: Playlist) -> TrackStream:
        """Returns the fetch already in flight for this playlist, starting one if there isn't one."""
        key: TrackStreamKey = (self.user_id, playlist.id, playlist.snapshot_id)
        if (stream := self.track_streams.get(key)) is not None:
            return stream

        stream = TrackStream()
        self.track_streams[key] = stream

        # detached from the request, so abandoning the stream still fills the cache
        task = asyncio.create_task(self._fetch_and_cache_tracks(playlist, stream, key))
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)
        return stream

    async def _fetch_and_cache_tracks(
        self, playlist: Playlist, stream: TrackStream, key: TrackStreamKey
    ) -> None:
        """Fetches and caches tracks to completion, no matter who's listening."""
        try:
            try:
                await self._publish_tracks(playlist, stream)
            except Exception as error:
                logger.error(f"Failed to fetch tracks for {playlist.id}: {error}")
                await stream.close(error)  # tells followers to stop
                return

            # release followers, then cache
            await stream.close()
            await self._cache_tracks(playlist, stream.tracks)
        finally:
            self.track_streams.pop(key, None)

    async def _publish_tracks(self, playlist: Playlist, stream: TrackStream) -> None:
        if playlist.id == LIKED_SONGS_ID:
            tracks = self.spotify.get_saved_tracks()
        else:
            tracks = self.spotify.get_playlist_tracks(playlist.id)

        batch: list[Track] = []
        async for track in tracks:
            batch.append(track)
            if len(batch) >= TRACK_PUBLISH_BATCH:
                await stream.publish(batch)
                batch = []
        await stream.publish(batch)

    async def _cache_tracks(self, playlist: Playlist, tracks: list[Track]) -> None:
        try:
            await self.cache.set_playlist_tracks(
                self.user_id,
                playlist.id,
                playlist.snapshot_id,
                tracks,
            )
        except Exception as error:
            logger.error(f"Failed to cache tracks for {playlist.id}: {error}")

    async def create_playlist(self, name: str, description: str) -> Playlist:
        new_playlist = await self.spotify.create_playlist(name, description)
        await self._invalidate_playlists()
        return new_playlist

    async def add_playlist_tracks(self, playlist_id: str, uris: list[str]) -> None:
        await self.spotify.add_playlist_tracks(playlist_id, uris)
        await self._invalidate_playlists()

    async def remove_playlist_tracks(self, playlist_id: str, uris: list[str]) -> None:
        if playlist_id == LIKED_SONGS_ID:
            await self.spotify.remove_saved_tracks(uris)
        else:
            await self.spotify.remove_playlist_tracks(playlist_id, uris)
        await self._invalidate_playlists()

    async def _invalidate_playlists(self) -> None:
        await self.cache.invalidate_playlists(self.user_id)

    def _is_playlist_owned(self, playlist: Playlist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
