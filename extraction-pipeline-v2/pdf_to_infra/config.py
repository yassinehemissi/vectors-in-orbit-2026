from __future__ import annotations

import os


def docling_url() -> str:
    return os.getenv("DOCLING_URL", "").rstrip("/")


def docling_token() -> str | None:
    return os.getenv("DOCLING_TOKEN") or os.getenv("DOCLING_API_KEY")


def grobid_url() -> str:
    return os.getenv("GROBID_URL", "").rstrip("/")


def grobid_token() -> str | None:
    return os.getenv("GROBID_TOKEN")


def scrapper_url() -> str:
    return os.getenv("SCRAPPER_URL", "http://127.0.0.1:4010").rstrip("/")


def api_port() -> int:
    return int(os.getenv("PORT", "4020"))
