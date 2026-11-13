from fastapi import Depends

from src.database.service import DatabaseService, get_database_service
from src.services.spotify.dependencies import get_spotify_service
from src.services.spotify.service import SpotifyService
from src.services.swipe.service import SwipeService


def get_swipe_service(
    spotify: SpotifyService = Depends(get_spotify_service),
    db: DatabaseService = Depends(get_database_service),
) -> SwipeService:
    return SwipeService(spotify=spotify, db=db)
