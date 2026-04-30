from settings import STATE_KEY
from state import State
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse

router = APIRouter()


def get_app_state(request: Request) -> State:
    return request.app.state[STATE_KEY]


@router.get("/login")
def handle_login(state: State = Depends(get_app_state)) -> JSONResponse:
    return JSONResponse({"url": state.oauth.get_authorize_url()})


@router.get("/callback")
def handle_callback() -> JSONResponse:
    return JSONResponse({"message": "callback!"})
