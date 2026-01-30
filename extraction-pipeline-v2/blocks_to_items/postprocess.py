from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Dict, List

from .validator import enforce_evidence_ids


@dataclass
class ItemPostProcessor:
    def normalize_and_filter(self, items: List[Dict[str, object]]) -> List[Dict[str, object]]:
        out: List[Dict[str, object]] = []
        for it in items:
            if not isinstance(it, dict):
                continue
            it["item_id"] = _ensure_uuid(it.get("item_id"))

            cleaned, drop = enforce_evidence_ids(it)
            if drop:
                continue

            kind = cleaned.get("item_kind") or "claim"
            missing = _missing_for_kind(cleaned, kind)
            coverage = _coverage_from_missing(kind, missing)
            cleaned.setdefault("grounding", {})
            cleaned["grounding"]["coverage_level"] = coverage
            cleaned["grounding"].setdefault("source_section_ids", cleaned.get("grounding", {}).get("source_section_ids") or [])

            if missing:
                cleaned["grounding"]["missing_critical"] = missing

            if coverage == "L0_candidate":
                continue
            out.append(cleaned)
        return out


def _ensure_uuid(value: object) -> str:
    if isinstance(value, str):
        try:
            return str(uuid.UUID(value))
        except Exception:
            pass
    return str(uuid.uuid4())


def _missing_for_kind(item: Dict[str, object], kind: str) -> List[str]:
    missing = []
    if not _has_evidence(item.get("label")):
        missing.append("label")

    if kind == "experiment":
        if not _has_any(item, ["entities.samples", "entities.assays", "results.metrics"]):
            missing.append("assay_or_readout")
        if not _has_results(item):
            missing.append("results")
    elif kind == "method":
        if not _has_protocol(item):
            missing.append("protocol")
    elif kind == "claim":
        if not _has_evidence(item.get("summary")):
            missing.append("summary")
    elif kind == "dataset":
        if not _has_evidence(item.get("label")):
            missing.append("dataset")
    elif kind == "resource":
        if not _has_evidence(item.get("label")):
            missing.append("resource")
    elif kind == "negative_result":
        if not _has_results(item):
            missing.append("results")

    return missing


def _coverage_from_missing(kind: str, missing: List[str]) -> str:
    if "label" in missing:
        return "L0_candidate"
    if kind in ("method", "protocol_step"):
        return "L1_protocol" if "protocol" not in missing else "L0_candidate"
    if kind == "experiment":
        if "results" in missing:
            return "L2_design"
        return "L3_results"
    return "L1_protocol"


def _has_evidence(field: object) -> bool:
    return isinstance(field, dict) and bool(field.get("evidence"))


def _has_protocol(item: Dict[str, object]) -> bool:
    steps = ((item.get("protocol") or {}).get("steps")) or []
    for s in steps:
        if isinstance(s, dict) and _has_evidence(s.get("text")):
            return True
    return False


def _has_results(item: Dict[str, object]) -> bool:
    results = item.get("results") or {}
    metrics = results.get("metrics") or []
    has_metric = any(isinstance(m, dict) and _has_evidence(m.get("name")) for m in metrics)
    has_takeaway = _has_evidence(results.get("takeaway"))
    return has_metric or has_takeaway


def _get_path(item: Dict[str, object], path: str) -> object:
    cur: object = item
    for p in path.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(p)
    return cur


def _has_any(item: Dict[str, object], paths: List[str]) -> bool:
    for p in paths:
        val = _get_path(item, p)
        if isinstance(val, list):
            if any(isinstance(v, dict) and _has_evidence(v) for v in val):
                return True
        if _has_evidence(val):
            return True
    return False
