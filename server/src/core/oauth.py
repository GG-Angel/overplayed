from typing import Any, Protocol, cast
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from spotipy import SpotifyOAuth
from spotipy.cache_handler import CacheHandler


class SpotifyOAuthSettings(Protocol):
    spotify_client_id: str
    spotify_client_secret: str
    callback_url: str
    spotify_scope: str


class NoOpCacheHandler(CacheHandler):
    def get_cached_token(self) -> None:
        return None

    def save_token_to_cache(self, token_info: dict[str, object]) -> None:
        return None


class SpotifyOAuthPKCE(SpotifyOAuth):
    def get_authorize_url(
        self, state: str | None = None, code_challenge: str | None = None
    ) -> str:
        url = super().get_authorize_url(state=state)
        if code_challenge is None:
            return url

        parsed = urlsplit(url)
        query = parse_qsl(parsed.query, keep_blank_values=True)
        query.extend(
            [
                ("code_challenge", code_challenge),
                ("code_challenge_method", "S256"),
            ]
        )
        return urlunsplit(
            (
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                urlencode(query),
                parsed.fragment,
            )
        )

    def exchange_code(self, code: str, code_verifier: str) -> dict[str, Any]:
        payload = {
            "redirect_uri": self.redirect_uri,
            "code": code,
            "code_verifier": code_verifier,
            "grant_type": "authorization_code",
        }
        if self.scope:
            payload["scope"] = self.scope

        try:
            response = self._session.post(
                self.OAUTH_TOKEN_URL,
                data=payload,
                headers=self._make_authorization_headers(),
                verify=True,
                proxies=self.proxies,
                timeout=self.requests_timeout,
            )
            response.raise_for_status()
        except requests.exceptions.HTTPError as error:
            self._handle_oauth_error(error)

        token_info = cast(dict[str, Any], response.json())
        token_info = self._add_custom_values_to_token_info(token_info)
        self.cache_handler.save_token_to_cache(token_info)
        return token_info


def build_spotify_oauth(settings: SpotifyOAuthSettings) -> SpotifyOAuthPKCE:
    return SpotifyOAuthPKCE(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.callback_url,
        scope=settings.spotify_scope,
        cache_handler=NoOpCacheHandler(),
    )
