from datetime import datetime


def get_formatted_date() -> str:
    """Return the current date formatted as 'Month D, YYYY'"""
    return datetime.now().strftime("%B %-d, %Y")
