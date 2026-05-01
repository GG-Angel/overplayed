from typing import List
from models import SpotifyPlaylist, SpotifyCurrentUser
from cache.client import RedisClient
from spotify.client import SpotifyClient


class PlaylistNotOwnedError(Exception):
    pass


class SpotifyService:
    def __init__(self, spotify: SpotifyClient, redis: RedisClient, user_id: str):
        self.spotify = spotify
        self.redis = redis
        self.user_id = user_id

    async def get_user(self) -> SpotifyCurrentUser:
        user = await self.redis.get_user(self.user_id)
        if not user:
            user = await self.spotify.get_user()
            await self.redis.set_user(user)
        return user

    async def get_playlist(self, playlist_id: str) -> SpotifyPlaylist:
        playlist = await self.redis.get_playlist(playlist_id)
        if not playlist:
            playlist = await self.spotify.get_playlist(playlist_id)
            await self.redis.set_playlist(playlist)
        if not self._is_playlist_owned(playlist):
            raise PlaylistNotOwnedError()
        return playlist

    async def get_playlists(self) -> List[SpotifyPlaylist]:
        playlist_ids = await self.redis.get_playlist_ids(self.user_id)

        if playlist_ids:
            if playlists := await self.redis.get_playlists_by_ids(playlist_ids):
                return playlists

        playlists = await self.spotify.get_user_playlists()
        owned_playlists = [p for p in playlists if self._is_playlist_owned(p)]
        await self.redis.set_user_playlists(self.user_id, owned_playlists)
        return owned_playlists

    def _is_playlist_owned(self, playlist: SpotifyPlaylist) -> bool:
        return playlist.owner.id == self.user_id or playlist.collaborative
