from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import requests

from .config import GROBIDConfig


@dataclass
class PDFToTEI:
    config: GROBIDConfig = GROBIDConfig()

    def convert(self, pdf_path: Path) -> str:
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        url = self._base_url().rstrip("/") + self.config.endpoint
        timeout = self._timeout()

        with open(pdf_path, "rb") as f:
            files = {"input": f}
            data = {
                "generateIDs": "1",
                "consolidateCitations": "1",
                "includeRawCitations": "1",
                "includeRawAffiliations": "1",
                "teiCoordinates": ["s", "head", "note", "ref", "figure", "table"],
            }
            resp = requests.post(url, files=files, data=data, timeout=timeout)
            resp.raise_for_status()
            return resp.text

    def is_available(self) -> bool:
        url = self._base_url().rstrip("/") + self.config.alive_endpoint
        try:
            resp = requests.get(url, timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    def _base_url(self) -> str:
        return os.getenv(self.config.url_env) or self.config.default_url

    def _timeout(self) -> int:
        raw = os.getenv(self.config.timeout_env)
        if not raw:
            return self.config.default_timeout
        try:
            return int(raw)
        except ValueError:
            return self.config.default_timeout
