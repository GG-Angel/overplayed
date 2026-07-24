from fastapi import BackgroundTasks
from core.exceptions import BadRequestException
from database.schemas import SwipeSession, User
from database.service import DatabaseService
from services.spotify.models import Playlist, LIKED_SONGS_ID
from services.spotify.service import SpotifyService
from services.spotify.utils import get_formatted_date
from services.swipe.models import SwipesForm


class SwipeService:
    def __init__(self, spotify: SpotifyService, db: DatabaseService):
        self.spotify = spotify
        self.db = db

    async def apply_swipes(
        self,
        playlist_id: str,
        form: SwipesForm,
        background_tasks: BackgroundTasks,
    ) -> Playlist | None:
        source = await self.spotify.get_playlist(playlist_id)
        if not (len(form.uris) <= form.tracks_swiped <= source.tracks.total):
            raise BadRequestException()

        backup = None
        if form.options.backup_enabled:
            backup = await self.spotify.create_playlist(
                f"Overplayed / {source.name}",
                f"Generated on {get_formatted_date()}",
            )
            await self.spotify.add_playlist_tracks(backup.id, form.uris)

        await self.spotify.remove_playlist_tracks(source.id, form.uris)
        if form.options.remove_from_likes and playlist_id != LIKED_SONGS_ID:
            await self.spotify.remove_playlist_tracks(LIKED_SONGS_ID, form.uris)

        background_tasks.add_task(self._record_swipes, source, form)
        return backup

    async def _record_swipes(self, source: Playlist, form: SwipesForm) -> None:
        user = await self.spotify.get_current_user()
        await self.db.upsert_user(
            User(
                id=user.id,
                display_name=user.display_name,
                spotify_url=user.external_urls.spotify,
                picture_url=user.images[-1].url if user.images else None,
            )
        )
        await self.db.record_swipe_session(
            SwipeSession(
                user_id=self.spotify.user_id,
                playlist_id=source.id,
                snapshot_id=source.snapshot_id,
                total_tracks=source.tracks.total,
                tracks_swiped=form.tracks_swiped,
                tracks_cut=len(form.uris),
            )
        )
