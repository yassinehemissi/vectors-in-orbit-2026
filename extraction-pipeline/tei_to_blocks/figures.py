from __future__ import annotations

import re
from typing import Optional, Tuple

from .config import FigureDetectionConfig
from .text import norm_text


_FIG_REF = re.compile(r"\b(?:Fig\.|Figure)\s*(\d+[A-Za-z]?)\b", re.IGNORECASE)
_CAPTION_START = re.compile(r"^\s*(?:Fig\.|Figure)\s*\d+[A-Za-z]?\s*[:\.\-]\s*", re.IGNORECASE)


def extract_figure_label(text: str) -> Optional[str]:
    m = _FIG_REF.search(text or "")
    if not m:
        return None
    return f"Figure {m.group(1)}"


def detect_figure_caption(text: str, cfg: FigureDetectionConfig) -> Optional[Tuple[str, Optional[str]]]:
    t = norm_text(text)
    if not t:
        return None
    if len(t) > cfg.max_caption_chars:
        return None

    words = t.split()
    if len(words) > cfg.max_caption_words:
        return None

    if _CAPTION_START.match(t):
        return t, extract_figure_label(t)

    if cfg.allow_inline_reference:
        label = extract_figure_label(t)
        if label and ":" in t[:40]:
            return t, label

    return None
