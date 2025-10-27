from __future__ import annotations
from typing import List, Dict, Tuple
import logging
import numpy as np
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
from skimage.metrics import structural_similarity as ssim
from .schemas import ImageInfo, SyntheticImages, MetricsReport, Metric, ImageMetrics
from assets.registry import registry


log = logging.getLogger(__name__)


def _vec(img: Image.Image, target_size=(256, 256)) -> np.ndarray:
    """
    Flatten a PIL Image into a 1D numpy array.

    Args:
        img: PIL Image to vectorize

    Returns:
        Flattened numpy array of float32 pixel values
    """
    # Resize image to consistent dimensions
    img_resized = img.resize(target_size, Image.LANCZOS)
    arr = np.asarray(img_resized)
    return arr.reshape(-1).astype(np.float32)


def compute_quality_metrics(data: SyntheticImages) -> MetricsReport:
    """
    Compute quality metrics comparing synthetic images to originals.

    Calculates cosine similarity and SSIM (Structural Similarity Index) for each
    synthetic image by comparing it to the most similar original image of the same
    class. Uses cosine similarity to find the best matching original, then computes
    SSIM for structural comparison.

    Args:
        data: SyntheticImages containing original and synthetic image information

    Returns:
        MetricsReport containing quality metrics for each synthetic image
    """
    # Load and organize original images by label
    by_label: dict[str, list[tuple[ImageInfo, np.ndarray, np.ndarray]]] = {}
    for o in data.originals:
        try:
            with Image.open(o.path) as oi:
                oi_resized = oi.resize((256, 256), Image.LANCZOS)  # Resize to 256x256
                o_arr = np.asarray(oi_resized) 
                by_label.setdefault(o.label, []).append((o, _vec(oi), o_arr))
        except Exception as e:
            log.warning(f"Failed to load original image {o.path}: {e}")
            continue

    results: list[Metric] = []
    # Compare each synthetic to originals of same class
    for s in data.synthetics:
        originals = by_label.get(s.label, [])
        if not originals:
            log.debug(f"No originals found for label {s.label}")
            continue

        # Load synthetic image
        try:
            with Image.open(s.path) as si:
                si_resized = si.resize((256, 256), Image.LANCZOS)
                s_arr = np.asarray(si_resized)
                s_vec = _vec(si_resized)
        except Exception as e:
            log.warning(f"Failed to load synthetic image {s.path}: {e}")
            continue

        # Find best matching original using cosine similarity
        best_cos = -1.0
        best_o_arr = None
        for _, o_vec, o_arr in originals:
            try:
                cos = float(cosine_similarity(s_vec[None, :], o_vec[None, :])[0, 0])
                if cos > best_cos:
                    best_cos = cos
                    best_o_arr = o_arr
            except Exception as e:
                log.warning(f"Failed to compute similarity: {e}")
                continue

        # Compute SSIM with best matching original
        ssim_val = 0.0
        if best_o_arr is not None:
            try:
                ssim_val = float(ssim(s_arr, best_o_arr, channel_axis=2))
            except Exception as e:
                log.warning(f"Failed to compute SSIM: {e}")

        results.append(Metric(synthpath=s.path, cossim=best_cos, ssim=ssim_val))

    return MetricsReport(metrics=results)


def compute_basic_metrics(
    asset_ids: List[str],
) -> Tuple[List[ImageMetrics], Dict[str, float]]:
    """
    Compute basic image properties for a list of assets.

    Extracts fundamental image characteristics including dimensions, color mode,
    and file size. Also calculates summary statistics across all images.

    Args:
        asset_ids: List of asset IDs to analyze

    Returns:
        Tuple containing:
        - List of ImageMetrics with properties for each asset
        - Dictionary with summary statistics (averages and totals)
    """
    items: List[ImageMetrics] = []

    # Compute metrics for each asset
    for asset_id in asset_ids:
        asset = registry.get_asset(asset_id)
        if not asset:
            log.warning(f"Asset not found: {asset_id}")
            continue

        try:
            path = registry.resolve_path(asset)
            with Image.open(path) as img:
                metrics = ImageMetrics(
                    asset_id=asset_id,
                    width=img.width,
                    height=img.height,
                    mode=img.mode,
                    file_size=asset.size,
                )
                items.append(metrics)
        except Exception as e:
            log.error(f"Failed to compute metrics for {asset_id}: {e}")
            continue

    # Calculate summary statistics
    if items:
        summary = {
            "avg_width": sum(m.width for m in items) / len(items),
            "avg_height": sum(m.height for m in items) / len(items),
            "avg_file_size": sum(m.file_size for m in items) / len(items),
            "total_size": sum(m.file_size for m in items),
        }
    else:
        summary = {
            "avg_width": 0.0,
            "avg_height": 0.0,
            "avg_file_size": 0.0,
            "total_size": 0.0,
        }

    return items, summary
