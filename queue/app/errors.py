class SpotifyError(Exception):
    """Raised when a error occurs in the Spotify process."""

    pass


class SpotifyValidationError(SpotifyError):
    """Raised when a error occurs in the Spotify user validation process."""

    pass


class SpotifyTokenError(SpotifyError):
    """Raised when a error occurs in the Spotify token process."""

    pass


class SpotifyUserManagementError(SpotifyError):
    """Raised when a error occurs in the Spotify user management process."""

    pass


class SpotifySessionError(SpotifyError):
    """Raised when a error occurs in the Spotify session process."""

    pass
