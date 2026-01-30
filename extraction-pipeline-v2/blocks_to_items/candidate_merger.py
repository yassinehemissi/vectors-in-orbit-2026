from __future__ import annotations

import json
from dataclasses import dataclass
from typing import List

from .config import BlocksToItemsConfig
from .llm_client import LLMClient
from .models import Candidate
from .prompts import merge_prompt


@dataclass
class CandidateMerger:
    llm: LLMClient
    config: BlocksToItemsConfig

    def merge(self, candidates: List[Candidate]) -> List[Candidate]:
        if not candidates:
            return []
        return _deterministic_merge(candidates)

    def _merge_batch(self, candidates: List[Candidate]) -> List[Candidate]:
        # LLM merge removed; kept for interface compatibility.
        return _deterministic_merge(candidates)


def _ensure_list(data: object) -> list:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        items = data.get("items")
        if isinstance(items, list):
            return items
    return []


def _to_candidates(items: list) -> List[Candidate]:
    out: List[Candidate] = []
    for d in items:
        if not isinstance(d, dict):
            continue
        out.append(
            Candidate(
                candidate_id=d.get("candidate_id") or d.get("item_id") or "cand_unknown",
                section_id=(d.get("section_id") if d.get("section_id") else None),
                label=d.get("label"),
                summary=d.get("summary"),
                evidence_hints=d.get("evidence_hints") or [],
                proposed_item_kind=d.get("proposed_item_kind"),
                anchors=d.get("anchors") or [],
                source_block_ids=d.get("source_block_ids") or [],
                confidence=float(d.get("confidence") or 0.0),
            )
        )
    return out


def _deterministic_merge(candidates: List[Candidate]) -> List[Candidate]:
    seen = {}
    out: List[Candidate] = []
    for c in candidates:
        key = f"{(c.label or '').lower().strip()}|{(c.proposed_item_kind or '').lower()}"
        if key in seen:
            prev = seen[key]
            prev.anchors = list(set(prev.anchors + c.anchors))
            prev.evidence_hints = list(set(prev.evidence_hints + c.evidence_hints))
            prev.source_block_ids = list(set(prev.source_block_ids + c.source_block_ids))
            continue
        seen[key] = c
        out.append(c)
    return out
