from __future__ import annotations
from typing import List, Optional
from pathlib import Path
from pydantic import BaseModel, Field


class ImageRef(BaseModel):
    asset_id: str = Field(...)


class AugmentOptions(BaseModel):
    horizontal_flip: bool = False
    rotate_deg: Optional[int] = None


class AugmentRequest(BaseModel):
    images: List[ImageRef]
    options: AugmentOptions


class AugmentedImage(BaseModel):
    id: str
    filename: str
    url: str


class AugmentResult(BaseModel):
    count: int
    assets: List[AugmentedImage]


class ImageInfo(BaseModel):
    path: Path
    label: str


class SyntheticImages(BaseModel):
    originals: List[ImageInfo]
    synthetics: List[ImageInfo]
    

class ParameterSet(BaseModel):
    kneighbors: int = Field(default=5, ge=1)
    targetratio: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    randomstate: Optional[int] = Field(default=42)
