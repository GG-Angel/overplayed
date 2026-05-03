import logging
from loguru import logger


class _PropagateHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        logging.getLogger(record.name).handle(record)


logger.remove()
logger.add(_PropagateHandler(), format="{message}")
