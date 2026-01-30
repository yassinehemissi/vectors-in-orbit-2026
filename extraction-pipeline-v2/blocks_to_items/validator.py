from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

_EVIDENCE_RE = re.compile(r"^b_[0-9a-f]+$|^b_\\d+$")


def enforce_evidence_ids(item: Dict[str, Any]) -> Tuple[Dict[str, Any], bool]:
    """
    Filters evidence arrays to only valid block ids.
    Returns (item, drop) where drop is True if required evidence is missing.
    """
    drop = False

    def walk(obj: Any) -> Any:
        nonlocal drop
        if isinstance(obj, dict):
            if _is_field_str(obj):
                ev = obj.get("evidence") or []
                if isinstance(ev, list):
                    ev = [e for e in ev if isinstance(e, str) and _EVIDENCE_RE.match(e)]
                else:
                    ev = []
                obj["evidence"] = ev
                return obj
            for k, v in list(obj.items()):
                obj[k] = walk(v)
            return obj
        if isinstance(obj, list):
            return [walk(v) for v in obj]
        return obj

    cleaned = walk(item)

    grounding = cleaned.get("grounding") if isinstance(cleaned, dict) else None
    ev_ids = grounding.get("evidence_block_ids") if isinstance(grounding, dict) else []
    if not ev_ids:
        drop = True
    return cleaned, drop


def _is_field_str(obj: Dict[str, Any]) -> bool:
    return "value" in obj and "evidence" in obj and "confidence" in obj
