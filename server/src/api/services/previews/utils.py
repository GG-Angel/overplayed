from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone


def parse_expiration_timestamp(url: str) -> int:
    parsed = urlparse(url)
    hdnea = parse_qs(parsed.query)["hdnea"][0]
    params = dict(part.split("=", 1) for part in hdnea.split("~"))
    return int(params["exp"])


def parse_expires_in(url: str) -> int:
    exp_timestamp = parse_expiration_timestamp(url)
    expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    return int((expires_at - datetime.now(timezone.utc)).total_seconds())
