import logging
import logging.config
import sys


def configure_logging(level: str = "INFO", log_file: str = "app.log") -> None:
    """
    Configure application-wide logging with console and file handlers.

    Sets up structured logging with separate formatters for standard application
    logs and uvicorn server logs. Logs are written to both stdout and a file,
    with color-coded output for uvicorn logs in the console.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL). Defaults to "INFO"
        log_file: Path to log file for persistent storage. Defaults to "app.log"
    """
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                # Standard formatter for application logs
                "standard": {
                    "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
                },
                # Uvicorn-specific formatter with color support
                "uvicorn": {
                    "()": "uvicorn.logging.DefaultFormatter",
                    "fmt": "%(levelprefix)s %(asctime)s %(name)s %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                    "use_colors": True,
                },
            },
            "handlers": {
                # Console handler for standard logs
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "standard",
                    "stream": sys.stdout,
                },
                # File handler for persistent logging
                "file": {
                    "class": "logging.FileHandler",
                    "formatter": "standard",
                    "filename": log_file,
                    "mode": "a",
                },
                # Console handler for uvicorn logs with color
                "uvicorn": {
                    "class": "logging.StreamHandler",
                    "formatter": "uvicorn",
                    "stream": sys.stdout,
                },
            },
            "loggers": {
                # Root logger configuration
                "": {"handlers": ["default", "file"], "level": level},
                # Uvicorn main logger
                "uvicorn": {
                    "handlers": ["uvicorn", "file"],
                    "level": level,
                    "propagate": False,
                },
                # Uvicorn error logger
                "uvicorn.error": {"level": level, "propagate": True},
                # Uvicorn access logger for HTTP requests
                "uvicorn.access": {
                    "handlers": ["uvicorn", "file"],
                    "level": level,
                    "propagate": False,
                },
            },
        }
    )
