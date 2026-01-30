from __future__ import annotations

from pathlib import Path

import requests

from ..config import scrapper_url


def exists_remote(hash_key: str) -> bool:
    try:
        print(f"[pdf_to_infra] check exists hash={hash_key}")
        resp = requests.get(f"{scrapper_url()}/files/exists/{hash_key}", timeout=None)
        if not resp.ok:
            return False
        payload = resp.json()
        return bool(payload.get("exists"))
    except Exception:
        return False


def upload_file(hash_key: str, path: str, content: bytes, content_type: str) -> str | None:
    print(f"[pdf_to_infra] upload {path}")
    files = {"file": (Path(path).name, content, content_type)}
    data = {"hash": hash_key, "path": path}
    resp = requests.post(f"{scrapper_url()}/files/upload", files=files, data=data, timeout=None)
    resp.raise_for_status()
    return resp.json().get("url")
