from fastapi.responses import Response
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def handle_healthcheck() -> str:
    return ":3"


@router.get("/favicon.ico")
def handle_favicon() -> Response:
    return Response(status_code=204)  # no content
