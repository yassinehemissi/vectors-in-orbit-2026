from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Dict, List

from storage.astra.client import AstraClientFactory
from storage.qdrant.client import QdrantClientFactory

from .config import BlocksToItemsConfig
from .embedder import Embedder
from .llm_client import LLMClient
from .models import Block, Candidate, Section
from .prompts import section_items_prompt

_SIGNAL_CUES = [
    # measurement & quantification
    "measured",
    "quantified",
    "determined",
    "calculated",
    "normalized",
    
    # experimental comparison / outcome
    "compared",
    "difference",
    "increase",
    "decrease",
    "significant",
    
    # statistics (very strong signal)
    "n =",
    "p <",
    "p =",
    "mean ±",
    "standard deviation",
    "standard error",
    
    # protein-specific empirical language
    "protein levels",
    "protein abundance",
    "peptide",
    "digested",
    "fractionated",
    "enriched",
    
    # experimental execution verbs
    "incubated",
    "treated",
    "washed",
    "centrifuged",
    "purified",
    "expressed",
    
    # evidence anchors
    "figure",
    "fig.",
    "table",
]

_QUERY_CUES = [
    # protein measurement & quantification
    "protein quantification measurement abundance levels",
    
    # experimental comparison & results
    "comparison of protein levels increased decreased significant",
    
    # sample preparation & processing
    "protein sample preparation digestion fractionation purification",
    
    # biochemical activity & function
    "protein activity binding interaction kinetics",
    
    # statistical evaluation of experiments
    "statistical analysis p-value replicates error bars",
    
    # experimental workflow & protocol
    "experimental procedure incubation treatment washing centrifugation",
    
    # figures & tables describing results
    "figure table shows protein results",
    
    # datasets & deposited experimental data
    "experimental dataset accession deposited data",
]



@dataclass
class SectionCandidateGenerator:
    llm: LLMClient
    config: BlocksToItemsConfig
    embedder: Embedder

    def generate(self, paper_id: str, sections: List[Section]) -> List[Candidate]:
        section_map: Dict[str, Section] = {s.section_id: s for s in sections}

        print("[candidate_generator] retrieval-first candidate discovery")
        hits_by_section = self._retrieve_seed_blocks()
        print(f"[candidate_generator] seed_sections={len(hits_by_section)}")

        out: List[Candidate] = []
        for section_id, block_ids in hits_by_section.items():
            if section_id not in section_map:
                continue
            sec_blocks = self._fetch_blocks_by_ids(paper_id, block_ids)
            if not sec_blocks:
                continue
            s = section_map.get(section_id, Section(section_id=section_id, title="", summary=None))
            glimpse = _section_context(sec_blocks, block_ids)
            if not glimpse:
                continue
            payload_blocks = [
                {"block_id": b.block_id, "type": b.type, "text": b.text}
                for b in glimpse
            ]
            print(f"[candidate_generator] section_id={section_id} num_blocks={len(glimpse)}")
            prompt = section_items_prompt(
                section_id=section_id,
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
                    candidate_id=_candidate_id(section_id, d),
                    section_id=section_id,
                    label=d.get("label"),
                    summary=d.get("summary"),
                    evidence_hints=d.get("evidence_hints") or [],
                    proposed_item_kind=d.get("proposed_item_kind"),
                    anchors=d.get("anchors") or [],
                    source_block_ids=[b.block_id for b in glimpse],
                    confidence=float(d.get("confidence") or 0.0),
                )
                out.append(cand)
        return out

    def _retrieve_seed_blocks(self) -> Dict[str, List[str]]:
        client = QdrantClientFactory().create()
        top_k = min(6, self.config.retrieval.top_k)
        hits: Dict[str, Dict[str, float]] = {}

        for q in _QUERY_CUES:
            vector = self.embedder.embed([q])[0]
            res = client.query_points(
                collection_name=self.config.storage.qdrant_blocks,
                query=vector,
                limit=top_k,
                with_payload=True,
            )
            for p in res.points:
                payload = p.payload or {}
                block_id = payload.get("block_id")
                section_id = payload.get("section_id")
                if not block_id or not section_id:
                    continue
                hits.setdefault(section_id, {})
                hits[section_id][block_id] = max(hits[section_id].get(block_id, 0.0), p.score or 0.0)

        out: Dict[str, List[str]] = {}
        for section_id, block_scores in hits.items():
            ordered = sorted(block_scores.items(), key=lambda kv: kv[1], reverse=True)
            out[section_id] = [bid for bid, _ in ordered[:8]]
        return out

    def _fetch_blocks_by_ids(self, paper_id: str, block_ids: List[str]) -> List[Block]:
        if not block_ids:
            return []
        cluster, session = AstraClientFactory().create()
        blocks: List[Block] = []
        try:
            for chunk in _chunk(block_ids, 50):
                placeholders = ", ".join(["%s"] * len(chunk))
                query = (
                    "SELECT block_id, section_id, type, text, block_index "
                    f"FROM blocks WHERE paper_id = %s AND block_id IN ({placeholders})"
                )
                params = [paper_id] + list(chunk)
                rows = session.execute(query, params)
                for r in rows:
                    blocks.append(
                        Block(
                            block_id=r.block_id,
                            section_id=r.section_id,
                            type=r.type,
                            text=r.text,
                            block_index=r.block_index,
                        )
                    )
        finally:
            cluster.shutdown()
        return blocks


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


def _section_context(blocks: List[Block], hit_block_ids: List[str]) -> List[Block]:
    if not blocks:
        return []
    blocks_sorted = sorted(blocks, key=lambda b: b.block_index)
    hit_set = set(hit_block_ids)

    # prioritize retrieval hits
    hits = [b for b in blocks_sorted if b.block_id in hit_set]
    hits = hits[:6]

    # add a couple of high-signal blocks as context
    scored = sorted(blocks_sorted, key=_signal_score, reverse=True)
    signal = [b for b in scored[:3] if _signal_score(b) > 0]

    out: List[Block] = []
    seen = set()
    for b in hits + signal:
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


def _chunk(items: List[str], size: int) -> List[List[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]
