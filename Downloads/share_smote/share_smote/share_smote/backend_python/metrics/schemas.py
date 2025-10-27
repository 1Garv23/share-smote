from __future__ import annotations
from typing import Dict, List
from pathlib import Path
from pydantic import BaseModel
from augment.schemas import ImageInfo, SyntheticImages


class ImageMetrics(BaseModel):
    asset_id: str
    width: int
    height: int
    mode: str
    file_size: int


class MetricsResult(BaseModel):
    count: int
    items: List[ImageMetrics]
    summary: Dict[str, float]


class Metric(BaseModel):
    synthpath: Path
    cossim: float
    ssim: float


class MetricsReport(BaseModel):
    metrics: List[Metric]
