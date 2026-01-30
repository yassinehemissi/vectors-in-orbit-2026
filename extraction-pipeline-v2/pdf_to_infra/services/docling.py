from __future__ import annotations

from pathlib import Path
from typing import Dict

import requests

from ..config import docling_token, docling_url


def call_docling(pdf_path: Path) -> Dict[str, object]:
    base = docling_url()
    url = f"{base}/v1/convert/file" if base else ""
    if not url:
        raise ValueError("Missing DOCLING_URL")
    headers = {}
    token = docling_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    print(f"[pdf_to_infra] docling url={url}")
    with open(pdf_path, "rb") as f:
        files = [
            ("files", (pdf_path.name, f, "application/pdf")),
        ]
        data = {
            "target_type": "inbody",
            "to_formats": "json",
            "from_formats": "pdf",
            "image_export_mode": "embedded",
            "do_table_structure": "true",
            "include_images": "true",
        }
        resp = requests.post(url, files=files, data=data, headers=headers, timeout=None)
        resp.raise_for_status()
        return resp.json()
