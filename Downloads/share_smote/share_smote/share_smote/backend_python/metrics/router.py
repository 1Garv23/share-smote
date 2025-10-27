from __future__ import annotations
from typing import Annotated, List
from fastapi import APIRouter, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
from metrics.schemas import MetricsResult
from metrics.service import compute_basic_metrics
from config import settings
from auth import verify_api_key


router = APIRouter(prefix="/metrics", tags=["metrics"])
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


class MetricsRequest(BaseModel):
    """Request model for computing image metrics."""

    asset_ids: List[str] = Field(
        ..., min_items=1, description="List of asset IDs to analyze"
    )


@router.post("/basic", response_model=MetricsResult)
def post_basic_metrics(
    req: MetricsRequest, key: Annotated[str, Security(verify_api_key)]
) -> MetricsResult:
    """
    Compute basic image metrics for specified assets.

    Calculates fundamental image properties such as dimensions, format,
    color statistics, and other basic characteristics for the provided assets.

    Args:
        req: MetricsRequest containing list of asset IDs to analyze
        key: API key for authentication (validated via Security dependency)

    Returns:
        MetricsResult containing individual metrics per asset and summary statistics
    """
    items, summary = compute_basic_metrics(req.asset_ids)
    return MetricsResult(count=len(items), items=items, summary=summary)
