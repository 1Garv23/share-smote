from __future__ import annotations
import logging
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from assets.router import router as assets_router
from upload.router import router as upload_router
from augment.router import router as augment_router
from metrics.router import router as metrics_router
from params.router import router as params_router
from config import settings
from logger.logging_config import configure_logging


# Initialize logging and rate limiter
configure_logging(settings.LOGLEVEL)
log = logging.getLogger("app")
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI application
app = FastAPI(title=settings.APPNAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Add security headers to all HTTP responses.

    Implements defense-in-depth security measures including XSS protection,
    clickjacking prevention, content type sniffing protection, and HTTPS enforcement.

    Args:
        request: Incoming HTTP request
        call_next: Next middleware or route handler in the chain

    Returns:
        Response with added security headers
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """
    Add unique request ID to each request for tracing and logging.

    Generates a UUID for each request and includes it in the response headers
    to enable request tracking across the application stack.

    Args:
        request: Incoming HTTP request
        call_next: Next middleware or route handler in the chain

    Returns:
        Response with X-Request-ID header
    """
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Configure host validation middleware if allowed hosts are specified
if settings.ALLOWEDHOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWEDHOSTS)

# Configure CORS middleware if origins are specified
if settings.CORSORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORSORIGINS,
        allow_credentials=settings.CORSALLOWCREDENTIALS,
        allow_methods=settings.CORSALLOWMETHODS,
        allow_headers=settings.CORSALLOWHEADERS,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handle all unhandled exceptions globally.

    Logs exception details for debugging while returning a generic error message
    to clients to avoid leaking internal implementation details.

    Args:
        request: Request that triggered the exception
        exc: Exception that was raised

    Returns:
        JSONResponse with 500 status and generic error message
    """
    log.exception(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
@limiter.limit("100/minute")
def health(request: Request) -> dict:
    """
    Basic health check endpoint.

    Provides a simple liveness check to verify the application is running.
    Rate limited to prevent abuse.

    Args:
        request: HTTP request (required for rate limiting)

    Returns:
        Dictionary with status and application name
    """
    return {"status": "ok", "app": settings.APPNAME}


@app.get("/ready")
@limiter.limit("100/minute")
def ready(request: Request) -> JSONResponse:
    """
    Readiness check endpoint for deployment orchestration.

    Verifies the application can serve traffic by testing critical dependencies
    like the asset registry. Returns 503 if not ready to accept requests.

    Args:
        request: HTTP request (required for rate limiting)

    Returns:
        JSONResponse with status 200 if ready, 503 if not ready
    """
    from assets.registry import registry

    try:
        # Test registry accessibility
        _ = registry.list_assets()
        return JSONResponse({"status": "ready"})
    except Exception as e:
        log.exception("Readiness check failed: %s", e)
        return JSONResponse({"status": "not_ready", "error": str(e)}, status_code=503)


# Register API routers
app.include_router(assets_router)
app.include_router(upload_router)
app.include_router(augment_router)
app.include_router(metrics_router)
app.include_router(params_router)
