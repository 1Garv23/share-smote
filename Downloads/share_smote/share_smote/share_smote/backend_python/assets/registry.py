from __future__ import annotations
import hashlib
import json
import mimetypes
import os
import shutil
import tempfile
import time
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional
import logging
from filelock import FileLock
from config import settings


log = logging.getLogger(__name__)


@dataclass
class Asset:
    """Represents a file asset with metadata.

    Attributes:
        id: Unique identifier for the asset
        filename: Original filename
        relpath: Relative path from data root
        mimetype: MIME type of the file
        size: File size in bytes
        sha256: SHA-256 hash of the file content
        created_at: Unix timestamp of creation
        label: Optional label for categorization
    """

    id: str
    filename: str
    relpath: str
    mimetype: str
    size: int
    sha256: str
    created_at: float
    label: Optional[str] = None


class AssetRegistry:
    """Thread-safe registry for managing file assets with JSON persistence."""

    def __init__(self, index_path: Path, lock_path: Optional[Path] = None) -> None:
        """Initialize the asset registry.

        Args:
            index_path: Path to the JSON index file
            lock_path: Optional path to the lock file (defaults to index_path with .lock extension)
        """
        self.index_path = index_path
        self.lock_path = lock_path or index_path.with_suffix(".lock")
        self.lock = FileLock(str(self.lock_path), timeout=10)
        self.ensure_index()

    def ensure_index(self) -> None:
        """Create the index file and parent directories if they don't exist."""
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.index_path.exists():
            self.atomic_write({"version": 1, "assets": {}})

    def read(self) -> Dict:
        """Read the registry index from disk.

        Returns:
            Dictionary containing registry data with 'version' and 'assets' keys
        """
        if not self.index_path.exists():
            return {"version": 1, "assets": {}}
        try:
            with self.index_path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            log.error(f"Failed to read registry: {e}")
            return {"version": 1, "assets": {}}

    def atomic_write(self, payload: Dict) -> None:
        """Write registry data atomically to prevent corruption.

        Args:
            payload: Dictionary to write to the index file

        Raises:
            Exception: If write operation fails
        """
        tmp = None
        try:
            tmp = tempfile.NamedTemporaryFile(
                "w",
                delete=False,
                dir=str(self.index_path.parent),
                encoding="utf-8",
                prefix=".tmp_registry_",
            )
            json.dump(payload, tmp, ensure_ascii=False, indent=2)
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp.close()
            os.replace(tmp.name, self.index_path)
            tmp = None
        except Exception as e:
            log.error(f"Failed to write registry: {e}")
            raise
        finally:
            if tmp is not None:
                try:
                    os.unlink(tmp.name)
                except OSError:
                    pass

    @staticmethod
    def sha256_file(p: Path, bufsize: int = 1024 * 1024) -> str:
        """Calculate SHA-256 hash of a file.

        Args:
            p: Path to the file
            bufsize: Buffer size for reading (default 1MB)

        Returns:
            Hexadecimal SHA-256 hash string
        """
        h = hashlib.sha256()
        with p.open("rb") as f:
            while True:
                b = f.read(bufsize)
                if not b:
                    break
                h.update(b)
        return h.hexdigest()

    def list_assets(self) -> List[Asset]:
        """Retrieve all assets from the registry.

        Returns:
            List of Asset objects
        """
        with self.lock:
            data = self.read()
            assets: Dict[str, Dict] = data.get("assets", {})
            out: List[Asset] = []
            for aid, meta in assets.items():
                try:
                    out.append(Asset(**meta))
                except (TypeError, KeyError) as e:
                    log.warning(f"Skipping malformed asset {aid}: {e}")
            return out

    def get_asset(self, asset_id: str) -> Optional[Asset]:
        """Retrieve a specific asset by ID.

        Args:
            asset_id: Unique asset identifier

        Returns:
            Asset object if found, None otherwise
        """
        with self.lock:
            data = self.read()
            meta = data.get("assets", {}).get(asset_id)
            if meta:
                try:
                    return Asset(**meta)
                except (TypeError, KeyError) as e:
                    log.error(f"Malformed asset metadata for {asset_id}: {e}")
        return None

    def delete_asset(self, asset_id: str) -> bool:
        """Delete an asset from both filesystem and registry.

        Args:
            asset_id: Unique asset identifier

        Returns:
            True if deletion successful, False if asset not found
        """
        with self.lock:
            data = self.read()
            assets: Dict[str, Dict] = data.get("assets", {})
            meta = assets.get(asset_id)
            if not meta:
                return False
            relpath = meta["relpath"]
            abspath = settings.DATAPATH / relpath
            try:
                if abspath.exists():
                    parent = abspath.parent
                    abspath.unlink(missing_ok=True)
                    # Remove empty parent directory if not the assets root
                    try:
                        if parent != settings.ASSETSPATH:
                            parent.rmdir()
                    except OSError:
                        pass
            except Exception as e:
                log.error(f"Failed to delete asset file {abspath}: {e}")
            finally:
                assets.pop(asset_id, None)
                data["assets"] = assets
                self.atomic_write(data)
                log.info(f"Deleted asset {asset_id}")
            return True

    def add_file(
        self, source: Path, original_filename: str, label: Optional[str] = None
    ) -> Asset:
        """Add a file to the asset registry.

        Args:
            source: Path to the source file to add
            original_filename: Original name of the file
            label: Optional label for categorization

        Returns:
            Asset object representing the added file

        Raises:
            ValueError: If filename is invalid
            PermissionError: If path traversal is attempted
        """
        asset_id = str(uuid.uuid4())
        safename = Path(original_filename).name
        if safename != original_filename or ".." in safename or "/" in safename:
            raise ValueError(f"Invalid filename: {original_filename}")
        asset_dir = settings.ASSETSPATH / asset_id
        asset_dir.mkdir(parents=True, exist_ok=True)
        dest = asset_dir / safename
        # Security check: prevent path traversal
        if not dest.resolve().is_relative_to(settings.ASSETSPATH.resolve()):
            raise PermissionError("Attempted path traversal")
        shutil.move(str(source), str(dest))
        size = dest.stat().st_size
        sha256 = self.sha256_file(dest)
        mimetype = mimetypes.guess_type(dest.name)[0] or "application/octet-stream"
        relpath = dest.relative_to(settings.DATAPATH).as_posix()
        record = Asset(
            id=asset_id,
            filename=safename,
            relpath=relpath,
            mimetype=mimetype,
            size=size,
            sha256=sha256,
            created_at=time.time(),
            label=label,
        )
        with self.lock:
            data = self.read()
            assets: Dict[str, Dict] = data.get("assets", {})
            assets[asset_id] = asdict(record)
            data["assets"] = assets
            self.atomic_write(data)
        log.info(f"Added asset {asset_id}: {safename} (label: {label})")
        return record

    def resolve_path(self, asset: Asset) -> Path:
        """Resolve an asset to its absolute filesystem path.

        Args:
            asset: Asset object to resolve

        Returns:
            Absolute Path object

        Raises:
            PermissionError: If resolved path escapes data root
            FileNotFoundError: If asset file doesn't exist
        """
        abspath = (settings.DATAPATH / asset.relpath).resolve()
        dataroot = settings.DATAPATH.resolve()
        if not abspath.is_relative_to(dataroot):
            raise PermissionError("Resolved path escapes data root")
        if not abspath.exists():
            raise FileNotFoundError(f"Asset file not found: {abspath}")
        return abspath


# Global registry instance
registry = AssetRegistry(settings.REGISTRYFILE)
