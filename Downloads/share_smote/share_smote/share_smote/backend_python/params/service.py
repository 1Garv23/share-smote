from __future__ import annotations
import json
import os
import tempfile
from typing import Any, Dict
from filelock import FileLock
from config import settings


SETTINGS_PATH = settings.PARAMSFILE


class ParamsStore:
    """Thread-safe storage for SMOTE parameters with JSON persistence."""

    def __init__(self) -> None:
        """Initialize the parameters store and ensure parent directories exist."""
        self.path = settings.PARAMSFILE
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = FileLock(str(self.path.with_suffix(".lock")))

    def _read_unlocked(self) -> Dict[str, Any]:
        """
        Read parameters from disk without acquiring lock.

        This method assumes the caller has already acquired the lock.

        Returns:
            Dictionary containing parameter values, empty dict if file doesn't exist
        """
        if not self.path.exists():
            return {}
        with self.path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def _atomic_write_unlocked(self, payload: Dict[str, Any]) -> None:
        """
        Write parameters to disk atomically without acquiring lock.

        Uses atomic file replacement to prevent corruption from partial writes.
        This method assumes the caller has already acquired the lock.

        Args:
            payload: Dictionary of parameters to write
        """
        with tempfile.NamedTemporaryFile(
            "w", delete=False, dir=str(self.path.parent), encoding="utf-8"
        ) as tmp:
            json.dump(payload, tmp, ensure_ascii=False, indent=2)
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp_name = tmp.name
        os.replace(tmp_name, self.path)

    def get(self) -> Dict[str, Any]:
        """
        Retrieve current parameters in a thread-safe manner.

        Returns:
            Dictionary containing current parameter values
        """
        with self.lock:
            return self._read_unlocked()

    def set(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update parameters in a thread-safe manner.

        Args:
            data: Dictionary of parameter values to store

        Returns:
            The stored parameter dictionary
        """
        with self.lock:
            self._atomic_write_unlocked(data)
            return data


# Global parameters store instance
store = ParamsStore()
