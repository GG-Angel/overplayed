from state import State
from server import STATE_KEY
from fastapi import APIRouter, Request, Depends

router = APIRouter()


def get_app_state(request: Request) -> State:
    return request.app.state[STATE_KEY]


@router.get("/login")
def handle_login(state: State = Depends(get_app_state)):
    return {"url": state.oauth.get_authorize_url()}


@router.get("/callback")
def handle_callback():
    return {"message": "callback!"}
