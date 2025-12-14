from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Config(BaseSettings):
    sp_client_id: str = ""
    sp_client_secret: str = ""
    sp_scope: str = "playlist-read-private playlist-modify-private playlist-modify-public user-top-read"

    session_secret_key: str = ""


config = Config()
