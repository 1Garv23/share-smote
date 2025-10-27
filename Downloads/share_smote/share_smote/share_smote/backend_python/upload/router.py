from __future__ import annotations
from typing import Annotated, List
from fastapi import APIRouter, File, Security, UploadFile
from fastapi.security import APIKeyHeader
from config import settings
from upload.schemas import UploadResult, AssetOut
from upload.service import ingest_zip
from auth import verify_api_key


router = APIRouter(prefix="/upload", tags=["upload"])
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


class UploadResponse(UploadResult):
    """Response model for upload endpoints, extends UploadResult."""

    pass


@router.post("/zip", response_model=UploadResponse)
async def upload_zip(
    file: UploadFile = File(...), key: Annotated[str, Security(verify_api_key)] = None
) -> UploadResult:
    """
    Upload and extract a ZIP archive containing images organized by class.

    Expects a ZIP file with nested structure where images are organized in folders
    by class name (e.g., class_name/image.jpg). Each extracted image is registered
    as an asset with its corresponding class label.

    Args:
        file: ZIP file upload containing images organized by class folders
        key: API key for authentication (validated via Security dependency)

    Returns:
        UploadResult containing count and list of created assets with metadata
    """
    created = ingest_zip(file)
    assets: List[AssetOut] = []
    for asset_id, filename, label in created:
        assets.append(
            AssetOut(
                id=asset_id,
                filename=filename,
                url=f"/assets/{asset_id}",
                label=label,
            )
        )
    return UploadResult(count=len(assets), assets=assets)
