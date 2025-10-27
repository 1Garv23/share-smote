from __future__ import annotations
import uuid
import logging
from collections import Counter
from typing import List, Tuple
import numpy as np
from PIL import Image
from imblearn.over_sampling import SMOTE
from .schemas import SyntheticImages, ParameterSet, ImageInfo, AugmentOptions
from assets.registry import registry
from config import settings


log = logging.getLogger(__name__)
# Target dimensions for image resizing before SMOTE
SIZE = (256, 256)


def _validate_image(im: Image.Image) -> None:
    """
    Validate that an image has a supported color mode.

    Args:
        im: PIL Image object to validate

    Raises:
        ValueError: If image mode is not RGB, L, RGBA, or P
    """
    if im.mode not in ["RGB", "L", "RGBA", "P"]:
        raise ValueError(
            f"Unsupported mode; expected RGB, L, RGBA, or P, got {im.mode}"
        )


def vec(img: Image.Image, target_size=(256, 256)) -> np.ndarray:
    """Flatten a PIL Image into a 1D numpy array with consistent dimensions."""
    # Resize image to consistent dimensions
    img_resized = img.resize(target_size, Image.LANCZOS)
    arr = np.asarray(img_resized)
    return arr.reshape(-1).astype(np.float32)


def mat(vec: np.ndarray, shape: tuple) -> Image.Image:
    """
    Reconstruct a PIL Image from a flattened vector.

    Args:
        vec: Flattened numpy array of pixel values
        shape: Target shape as (height, width, channels)

    Returns:
        PIL Image reconstructed from the vector
    """
    return Image.fromarray(vec.reshape(shape[0], shape[1], shape[2]).astype(np.uint8))


def load_params() -> ParameterSet:
    """
    Load SMOTE parameters from configuration file.

    Returns:
        ParameterSet with loaded values or defaults if file not found/invalid
    """
    settings_path = settings.PARAMSFILE
    if not settings_path.exists():
        log.warning("SMOTE parameters not found, using defaults")
        return ParameterSet()
    try:
        import json

        data = json.loads(settings_path.read_text(encoding="utf-8"))
        return ParameterSet(**data)
    except Exception as e:
        log.error(f"Failed to load parameters: {e}, using defaults")
        return ParameterSet()


def _compute_strategy(y: list[str], targetratio: float | None) -> dict[str, int]:
    """
    Compute SMOTE sampling strategy based on class distribution.

    Only classes with at least 2 samples and below the target count are included.

    Args:
        y: List of class labels
        targetratio: Target ratio relative to majority class (None means match majority)

    Returns:
        Dictionary mapping class names to target sample counts
    """
    counts = Counter(y)
    # Only consider classes with at least 2 samples (SMOTE requirement)
    eligible = {cls: cnt for cls, cnt in counts.items() if cnt >= 2}
    if not eligible:
        return {}
    maxcount = max(eligible.values())
    if targetratio is None:
        target = maxcount
    else:
        target = int(maxcount * float(targetratio))
    if target <= 0:
        return {}
    # Only resample classes below target
    return {cls: target for cls, cnt in eligible.items() if cnt < target}


def run_smote(originals: list[ImageInfo]) -> SyntheticImages:
    """
    Generate synthetic images using SMOTE to balance class distribution.

    Loads original images, converts them to RGB, resizes to standard dimensions,
    vectorizes them, and applies SMOTE oversampling to minority classes. Generated
    synthetic images are saved to disk organized by class label.

    Args:
        originals: List of ImageInfo objects containing paths and labels

    Returns:
        SyntheticImages containing both original and synthetic image information
    """
    params = load_params()
    X: list[np.ndarray] = []
    y: list[str] = []
    target_width, target_height = SIZE

    # Load and preprocess images
    for info in originals:
        try:
            with Image.open(info.path) as im:
                _validate_image(im)
                # Convert all images to RGB
                if im.mode == "L":
                    im = im.convert("RGB")
                elif im.mode == "RGBA":
                    background = Image.new("RGB", im.size, (255, 255, 255))
                    background.paste(im, mask=im.split()[3])
                    im = background
                elif im.mode == "P":
                    im = im.convert("RGB")
                elif im.mode != "RGB":
                    log.warning(
                        f"Skipping image with unsupported mode {im.mode}: {info.path}"
                    )
                    continue
                im_resized = im.resize(SIZE, Image.LANCZOS)
                X.append(vec(im_resized))
                y.append(info.label)
        except Exception as e:
            log.warning(f"Failed to load image {info.path}: {e}")
            continue

    if not X:
        return SyntheticImages(originals=originals, synthetics=[])

    from collections import Counter

    log.info(f"🔍 DEBUG - Class distribution: {dict(Counter(y))}")
    log.info(f"🔍 DEBUG - Total images: {len(y)}")
    log.info(f"🔍 DEBUG - Unique classes: {len(set(y))}")

    # Compute resampling strategy
    strategy = _compute_strategy(y, params.targetratio)
    if not strategy:
        log.info("No resampling needed")
        return SyntheticImages(originals=originals, synthetics=[])

    # Adjust k_neighbors based on smallest class size
    eligible_counts = Counter(c for c in y if c in strategy)
    min_eligible = min(eligible_counts.values()) if eligible_counts else 0
    keff = max(1, min(int(params.kneighbors), max(1, min_eligible - 1)))

    # Apply SMOTE
    try:
        sm = SMOTE(
            k_neighbors=keff,
            sampling_strategy=strategy,
            random_state=params.randomstate,
        )
        X_res, y_res = sm.fit_resample(np.array(X), np.array(y))
    except Exception as e:
        log.error(f"SMOTE failed: {e}")
        return SyntheticImages(originals=originals, synthetics=[])

    # Save synthetic images
    synthetics: list[ImageInfo] = []
    output_dir = settings.ASSETSPATH / "synthetic"
    for vec_row, label in zip(X_res[len(X) :], y_res[len(y) :]):
        shape = (SIZE[1], SIZE[0], 3)
        try:
            # Convert vector back to image
            img = mat(vec_row, shape)

            # Ensure image is exactly 256x256
            img_resized = img.resize(SIZE, Image.LANCZOS)

            # Save resized synthetic image
            fname = f"{uuid.uuid4().hex}-{label}.png"
            savepath = output_dir / label
            savepath.mkdir(parents=True, exist_ok=True)
            full_path = savepath / fname
            img_resized.save(full_path)

            # Track saved image
            synthetics.append(ImageInfo(path=full_path, label=label))
        except Exception as e:
            log.error(f"Failed to save synthetic image: {e}")
            continue

    log.info(f"Generated {len(synthetics)} synthetic images")
    return SyntheticImages(originals=originals, synthetics=synthetics)


def augment_images(
    asset_ids: List[str], options: AugmentOptions
) -> List[Tuple[str, str]]:
    """
    Apply traditional augmentation transforms to images.

    Performs geometric transformations (horizontal flip, rotation) on specified
    assets and saves the augmented versions as new assets in the registry.

    Args:
        asset_ids: List of asset IDs to augment
        options: AugmentOptions specifying transforms to apply

    Returns:
        List of tuples containing (new_asset_id, new_filename) for each created asset
    """
    created: List[Tuple[str, str]] = []
    for asset_id in asset_ids:
        asset = registry.get_asset(asset_id)
        if not asset:
            log.warning(f"Asset not found: {asset_id}")
            continue
        try:
            path = registry.resolve_path(asset)
            with Image.open(path) as img:
                augmented = img.copy()
                # Apply horizontal flip if requested
                if options.horizontal_flip:
                    augmented = augmented.transpose(Image.FLIP_LEFT_RIGHT)
                # Apply rotation if requested
                if options.rotate_deg in [90, 180, 270]:
                    if options.rotate_deg == 90:
                        augmented = augmented.transpose(Image.ROTATE_270)
                    elif options.rotate_deg == 180:
                        augmented = augmented.transpose(Image.ROTATE_180)
                    elif options.rotate_deg == 270:
                        augmented = augmented.transpose(Image.ROTATE_90)
                # Save augmented image as new asset
                tmp_dir = settings.DATAPATH / "tmp"
                tmp_dir.mkdir(parents=True, exist_ok=True)
                tmp_path = tmp_dir / f"aug_{uuid.uuid4().hex}.png"
                augmented.save(tmp_path)
                new_filename = f"aug_{asset.filename}"
                new_asset = registry.add_file(tmp_path, original_filename=new_filename)
                created.append((new_asset.id, new_asset.filename))
        except Exception as e:
            log.error(f"Failed to augment {asset_id}: {e}")
            continue
    return created
