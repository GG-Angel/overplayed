from fastapi.responses import JSONResponse
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def handle_healthcheck() -> JSONResponse:
    return JSONResponse({"message": ":3"})
