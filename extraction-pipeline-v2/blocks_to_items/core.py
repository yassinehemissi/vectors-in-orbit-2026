from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List
from uuid import uuid4

from .candidate_generator import SectionCandidateGenerator
from .candidate_merger import CandidateMerger
from .config import BlocksToItemsConfig
from .document_store import AstraDocumentStore
from .embedder import Embedder
from .llm_client import LLMClient
from .models import Candidate
from .storage import ItemsStorage


@dataclass
class BlocksToItems:
    config: BlocksToItemsConfig = BlocksToItemsConfig()

    def __post_init__(self) -> None:
        self.doc_store = AstraDocumentStore(self.config.storage)
        self.llm = LLMClient(self.config.openai)
        self.cand_gen = SectionCandidateGenerator(self.llm, self.config, Embedder(self.config.embedding))
        self.cand_merge = CandidateMerger(self.llm, self.config)
        self.store = ItemsStorage(self.config)

    def run(self, paper_id: str) -> Dict[str, object]:
        print(f"[blocks_to_items] start paper_id={paper_id}")
        sections = self.doc_store.load_sections(paper_id)
        print(f"[blocks_to_items] sections={len(sections)}")
        
        print("[blocks_to_items] stage A: candidates per section")
        candidates = self.cand_gen.generate(paper_id, sections)
        print(f"[blocks_to_items] candidates={len(candidates)}")
        if candidates:
            print("[blocks_to_items] stage A: merge")
            candidates = self.cand_merge.merge(candidates)
            print(f"[blocks_to_items] merged_candidates={len(candidates)}")
        
        items: List[Dict[str, object]] = []
        for idx, cand in enumerate(candidates, start=1):
            cid = cand.candidate_id
            print(f"[blocks_to_items] candidate {idx}/{len(candidates)}: {cid}")
            items.append(_candidate_to_item(cand))

        print(f"[blocks_to_items] items={len(items)}")
        self.store.store(paper_id, items)
        print("[blocks_to_items] stored items")
        return {"paper_id": paper_id, "items": items}


def _candidate_to_item(cand: Candidate) -> Dict[str, object]:
    item_id = str(uuid4())
    return {
        "item_id": item_id,
        "item_kind": cand.proposed_item_kind,
        "label": cand.label,
        "summary": cand.summary,
        "confidence_overall": cand.confidence,
        "candidate_id": cand.candidate_id,
        "source_block_ids": cand.source_block_ids,
        "anchors": cand.anchors,
        "evidence_hints": cand.evidence_hints,
        "predicted_source_sections": [cand.section_id] if cand.section_id else [],
    }
