from dataclasses import dataclass
from spotify.users import UserManager
from spotify.validate import UserValidator
from spotify.token import TokenManager


@dataclass
class State:
    auth: TokenManager
    users: UserManager
    validator: UserValidator
