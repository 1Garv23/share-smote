from __future__ import annotations
from typing import Any, Dict
from pydantic import BaseModel


class ParamsPayload(BaseModel):
    data: Dict[str, Any]
