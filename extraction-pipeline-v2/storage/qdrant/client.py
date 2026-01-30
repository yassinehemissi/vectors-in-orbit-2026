from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from qdrant_client import QdrantClient


@dataclass(frozen=True)
class QdrantConfig:
    url_env: str = "QDRANT_URL"
    api_key_env: str = "QDRANT_API_KEY"
    timeout_env: str = "QDRANT_TIMEOUT_SEC"
    timeout_sec: int = 120


class QdrantClientFactory:
    def __init__(self, config: Optional[QdrantConfig] = None) -> None:
        self.config = config or QdrantConfig()

    def create(self) -> QdrantClient:
        url = os.getenv(self.config.url_env)
        if not url:
            raise ValueError(f"Missing {self.config.url_env} env var")

        api_key = os.getenv(self.config.api_key_env)
        if not api_key:
            raise ValueError(f"Missing {self.config.api_key_env} env var")

        timeout = self.config.timeout_sec
        raw_timeout = os.getenv(self.config.timeout_env)
        if raw_timeout:
            try:
                timeout = int(raw_timeout)
            except ValueError:
                pass

        return QdrantClient(
            url=url,
            api_key=api_key,
            timeout=None,
        )
