from typing import get_args, get_origin
from pydantic import BaseModel


def spotify_fields(model: type[BaseModel], is_nested: bool = False) -> str:
    """Generate Spotify API field string from a Pydantic model"""
    fields = []

    for name, field in model.model_fields.items():
        annotation = field.annotation
        origin = get_origin(annotation)

        if origin is list:
            arg = get_args(annotation)[0]
            if isinstance(arg, type) and issubclass(arg, BaseModel):
                fields.append(f"{name}({spotify_fields(arg, False)})")
            else:
                fields.append(name)

        elif isinstance(annotation, type) and issubclass(annotation, BaseModel):
            fields.append(f"{name}({spotify_fields(annotation, False)})")

        else:
            fields.append(name)

    fields_str = ",".join(fields)
    return f"items({fields_str})" if is_nested else fields_str
