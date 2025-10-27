from __future__ import annotations
from typing import Annotated
from fastapi import APIRouter, Security
from fastapi.security import APIKeyHeader
from params.schemas import ParamsPayload
from params.service import store
from config import settings
from auth import verify_api_key


router = APIRouter(prefix="/params", tags=["params"])
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


@router.get("")
def get_params() -> dict:
    """
    Retrieve current SMOTE parameters configuration.

    Returns:
        Dictionary containing current parameter values
    """
    return store.get()


@router.post("")
def set_params(
    payload: ParamsPayload, key: Annotated[str, Security(verify_api_key)]
) -> dict:
    """
    Update SMOTE parameters configuration.

    Args:
        payload: ParamsPayload containing new parameter values
        key: API key for authentication (validated via Security dependency)

    Returns:
        Dictionary containing updated parameter values
    """
    return store.set(payload.data)
