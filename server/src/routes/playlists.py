from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def handle_get_playlists():
    return "TODO"
