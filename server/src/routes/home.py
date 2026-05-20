from fastapi.responses import Response
from fastapi import APIRouter, Request
from core import limiter

router = APIRouter()


@router.get("/")
@limiter.limit("120/minute")
def handle_healthcheck(request: Request) -> str:
    return ":3"


@router.get("/favicon.ico")
@limiter.limit("60/minute")
def handle_favicon(request: Request) -> Response:
    return Response(status_code=204)  # no content
