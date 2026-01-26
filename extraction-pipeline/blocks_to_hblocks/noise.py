from __future__ import annotations

import re
from typing import Dict


_PUNCT_ONLY = re.compile(r"^[^\w\s]+$")
_NUM_ONLY = re.compile(r"^\d+$")
_DASHES = re.compile(r"^[-_\.=]{2,}$")
_WS = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    return _WS.sub(" ", (text or "").replace("\u00a0", " ")).strip()


def is_noise(text: str, block_type: str, min_len: int, allow_short: Dict[str, bool]) -> Dict[str, bool]:
    t = normalize_text(text)
    flags = {
        "is_empty": not t,
        "is_punct_only": bool(_PUNCT_ONLY.match(t)) if t else False,
        "is_numeric_only": bool(_NUM_ONLY.match(t)) if t else False,
        "is_dash_only": bool(_DASHES.match(t)) if t else False,
        "is_short": False,
    }

    if t and len(t) < min_len and not allow_short.get(block_type, False):
        flags["is_short"] = True

    flags["is_noise"] = any(
        flags[k] for k in ["is_empty", "is_punct_only", "is_numeric_only", "is_dash_only", "is_short"]
    )

    return flags
