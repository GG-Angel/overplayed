from fastapi.responses import JSONResponse, Response
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def handle_healthcheck() -> JSONResponse:
    return JSONResponse({"message": ":3"})


@router.get("/favicon.ico")
def handle_favicon() -> Response:
    return Response(status_code=204)
