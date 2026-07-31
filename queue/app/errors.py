class SpotifyError(Exception):
    """Raised when a error occurs in the Spotify process."""


class SpotifyValidationError(SpotifyError):
    """Raised when a error occurs in the Spotify user validation process."""


class SpotifyTokenError(SpotifyError):
    """Raised when a error occurs in the Spotify token process."""


class SpotifyUserManagementError(SpotifyError):
    """Raised when a error occurs in the Spotify user management process."""


class QueueLockError(Exception):
    """Raised when a distributed lock could not be acquired in time."""
