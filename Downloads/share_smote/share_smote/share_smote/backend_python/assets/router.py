from __future__ import annotations
import logging
from typing import Annotated
from fastapi import APIRouter, HTTPException, Security
from fastapi.responses import FileResponse
from fastapi.security import APIKeyHeader
from assets.registry import registry
from config import settings
from auth import verify_api_key


router = APIRouter(prefix="/assets", tags=["assets"])
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)
log = logging.getLogger(__name__)


@router.get("/{asset_id}")
async def get_asset(
    asset_id: str, key: Annotated[str, Security(verify_api_key)]
) -> FileResponse:
    """
    Retrieve and serve an asset file by its unique identifier.

    Args:
        asset_id: Unique identifier of the asset to retrieve
        key: API key for authentication (validated via Security dependency)

    Returns:
        FileResponse containing the asset file with appropriate headers

    Raises:
        HTTPException: 404 if asset not found or file missing, 500 for server errors
    """
    asset = registry.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    try:
        path = registry.resolve_path(asset)
        return FileResponse(
            path=str(path), media_type=asset.mimetype, filename=asset.filename
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Asset file not found")
    except Exception as e:
        log.error(f"Failed to serve asset {asset_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve asset")


@router.get("/")
async def list_assets(key: Annotated[str, Security(verify_api_key)]) -> dict:
    """
    Retrieve a list of all registered assets with their metadata.

    Args:
        key: API key for authentication (validated via Security dependency)

    Returns:
        Dictionary containing count and array of asset metadata objects
    """
    assets = registry.list_assets()
    return {
        "count": len(assets),
        "assets": [
            {
                "id": a.id,
                "filename": a.filename,
                "label": a.label,
                "size": a.size,
                "mimetype": a.mimetype,
                "created_at": a.created_at,
            }
            for a in assets
        ],
    }


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str, key: Annotated[str, Security(verify_api_key)]
) -> dict:
    """
    Delete an asset from both the registry and filesystem.

    Args:
        asset_id: Unique identifier of the asset to delete
        key: API key for authentication (validated via Security dependency)

    Returns:
        Dictionary containing deletion status and asset ID

    Raises:
        HTTPException: 404 if asset not found
    """
    success = registry.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"status": "deleted", "asset_id": asset_id}
