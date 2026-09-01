class SpotifyError(Exception):
    """Raised when a error occurs in the Spotify process."""


class SpotifyValidationError(SpotifyError):
    """Raised when a error occurs in the Spotify user validation process."""


class SpotifyTokenError(SpotifyError):
    """Raised when a error occurs in the Spotify token process."""


class SpotifyUserManagementError(SpotifyError):
    """Raised when a error occurs in the Spotify user management process."""


class QueueError(Exception):
    """Raised when a error occurs in the queue process."""


class QueueLockError(QueueError):
    """Raised when a distributed lock could not be acquired in time."""


class UnknownUserError(QueueError):
    """Raised when an email does not belong to an existing Spotify user."""


class InvalidTokenError(QueueError):
    """Raised when a one-time verification token is invalid or expired."""
