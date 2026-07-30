from base64 import b64decode, b64encode
from os import urandom
from typing import TypeVar

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pydantic import BaseModel

M = TypeVar("M", bound=BaseModel)


class Codec:
    def __init__(self, aesgcm: AESGCM):
        self._aesgcm = aesgcm

    def encrypt(self, plaintext: str) -> str:
        nonce = urandom(12)
        ciphertext = self._aesgcm.encrypt(nonce, plaintext.encode(), None)
        return b64encode(nonce + ciphertext).decode()

    def decrypt(self, encrypted: str) -> str:
        raw = b64decode(encrypted.encode())
        nonce, ciphertext = raw[:12], raw[12:]
        return self._aesgcm.decrypt(nonce, ciphertext, None).decode()

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
