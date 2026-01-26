from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GROBIDConfig:
    url_env: str = "GROBID_URL"
    timeout_env: str = "GROBID_TIMEOUT"
    default_url: str = "http://localhost:8070"
    default_timeout: int = 60
    endpoint: str = "/api/processFulltextDocument"
    alive_endpoint: str = "/api/isalive"
