import logging
from fastapi.security import APIKeyHeader
from fastapi import HTTPException, Security
from config import settings


log = logging.getLogger("app")
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """
    Verify API key authentication for protected endpoints.

    Checks if the provided API key is valid against the configured list of
    authorized keys. If authentication is disabled in settings, all requests
    are allowed through. Invalid key attempts are logged for security monitoring.

    Args:
        api_key: API key extracted from request header via Security dependency

    Returns:
        The validated API key string

    Raises:
        HTTPException: 403 if API key is invalid and authentication is required
    """
    # Skip authentication if disabled in configuration
    if not settings.REQUIRE_AUTH:
        return api_key

    # Validate API key against authorized list
    if api_key not in settings.VALID_API_KEYS:
        log.warning("Invalid API key attempt detected")
        raise HTTPException(status_code=403, detail="Invalid API key")

    return api_key
