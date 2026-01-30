from __future__ import annotations

import hashlib


def hash_pdf(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
