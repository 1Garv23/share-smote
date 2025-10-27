from __future__ import annotations
from typing import List
from pydantic import BaseModel, Field


class AssetOut(BaseModel):
    id: str = Field(...)
    filename: str = Field(...)
    url: str = Field(...)
    label: str = Field(...)


class UploadResult(BaseModel):
    count: int
    assets: List[AssetOut]
