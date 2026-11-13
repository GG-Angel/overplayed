from typing import TypeVar

from cryptography.fernet import Fernet
from pydantic import BaseModel

M = TypeVar("M", bound=BaseModel)


class Codec:
    def __init__(self, crypto: Fernet):
        self._crypto = crypto

    def encrypt(self, plaintext: str) -> str:
        return self._crypto.encrypt(plaintext.encode()).decode()

    def decrypt(self, encrypted: str) -> str:
        return self._crypto.decrypt(encrypted.encode()).decode()

    def model(self, m: type[M]) -> "ModelCodec[M]":
        return ModelCodec(m, self)


class ModelCodec[M: BaseModel]:
    def __init__(self, model: type[M], codec: Codec):
        self._model = model
        self._codec = codec

    def encrypt(self, instance: M) -> str:
        return self._codec.encrypt(instance.model_dump_json())

    def decrypt(self, encrypted: str) -> M:
        return self._model.model_validate_json(self._codec.decrypt(encrypted))
