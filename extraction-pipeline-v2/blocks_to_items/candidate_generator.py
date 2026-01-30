from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Dict, List

from .config import BlocksToItemsConfig
from .llm_client import LLMClient
from .models import Block, Candidate, Section
from .prompts import section_items_prompt


_SIGNAL_CUES = [
    "we measured",
    "we quantified",
    "n=",
    "p<",
    "p-value",
    "western blot",
    "lc-ms",
    "lc-ms/ms",
    "mass spectrometry",
    "elisa",
    "spr",
    "itc",
    "mst",
    "incubated",
    "enzyme activity",
    "assay",
    "figure",
    "table",
    "proteomics",
    "identified",
    "quantified",
]


@dataclass
class SectionCandidateGenerator:
    llm: LLMClient
    config: BlocksToItemsConfig

    def generate(self, sections: List[Section], blocks: List[Block]) -> List[Candidate]:
        by_section: Dict[str, List[Block]] = {}
        for b in blocks:
            by_section.setdefault(b.section_id, []).append(b)

        out: List[Candidate] = []
        for s in sections:
            sec_blocks = by_section.get(s.section_id, [])
            if not sec_blocks:
                continue
            glimpse = _section_glimpse(sec_blocks)
            payload_blocks = [
                {"block_id": b.block_id, "type": b.type, "text": b.text}
                for b in glimpse
            ]
            print(f"[candidate_generator] section_id={s.section_id} num_blocks={len(glimpse)}")
            prompt = section_items_prompt(
                section_id=s.section_id,
                section_title=s.title or "",
                blocks_json=json.dumps(payload_blocks, ensure_ascii=False),
            )
            data = self.llm.chat_json(
                model=self.config.openai.model_candidates,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            print(f"[candidate_generator] llm_response={data}")
            items = _ensure_list(data)
            for d in items:
                if not isinstance(d, dict):
                    continue
                cand = Candidate(
                    candidate_id=_candidate_id(s.section_id, d),
                    section_id=s.section_id,
                    label=d.get("label"),
                    summary=d.get("summary"),
                    evidence_hints=d.get("evidence_hints") or [],
                    proposed_item_kind=d.get("proposed_item_kind"),
                    anchors=d.get("anchors") or [],
                    source_block_ids=[b.block_id for b in glimpse],
                )
                out.append(cand)
        return out


def _ensure_list(data: object) -> list:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        items = data.get("items")
        if isinstance(items, list):
            return items
    return []


def _candidate_id(section_id: str, d: dict) -> str:
    raw = f"{section_id}::{d.get('label')}::{d.get('summary')}"
    return "cand_" + hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


def _section_glimpse(blocks: List[Block]) -> List[Block]:
    if not blocks:
        return []
    blocks_sorted = sorted(blocks, key=lambda b: b.block_index)
    n = 3
    head = blocks_sorted[:n]
    tail = blocks_sorted[-n:] if len(blocks_sorted) > n else []
    scored = sorted(blocks_sorted, key=_signal_score, reverse=True)
    signal = [b for b in scored[:4] if _signal_score(b) > 0]
    seen = {b.block_id for b in head}
    out = list(head)
    for b in tail + signal:
        if b.block_id in seen:
            continue
        out.append(b)
        seen.add(b.block_id)
    return out


def _signal_score(b: Block) -> int:
    text = (b.text or "").lower()
    score = 0
    for cue in _SIGNAL_CUES:
        if cue in text:
            score += 1
    score += len(re.findall(r"\b\d+(\.\d+)?\b", text)) // 5
    return score
