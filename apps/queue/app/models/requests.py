from pydantic import BaseModel, ConfigDict, Field


class AccessRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str
    turnstile_token: str = Field(alias="cf-turnstile-response")
