from __future__ import annotations

import hashlib
import uuid


def text_hash(text: str) -> str:
    data = (text or "").encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def vector_id(*parts: str) -> str:
    raw = "::".join(parts)
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, raw))
