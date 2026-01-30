from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from .candidate_generator import SectionCandidateGenerator
from .candidate_merger import CandidateMerger
from .config import BlocksToItemsConfig
from .document_store import AstraDocumentStore
from .embedder import Embedder
from .extractor import ItemExtractorLLM
from .llm_client import LLMClient
from .models import Candidate
from .postprocess import ItemPostProcessor
from .retrieval import HybridEvidenceRetriever
from .storage import ItemsStorage


@dataclass
class BlocksToItems:
    config: BlocksToItemsConfig = BlocksToItemsConfig()

    def __post_init__(self) -> None:
        self.doc_store = AstraDocumentStore(self.config.storage)
        self.llm = LLMClient(self.config.openai)
        self.cand_gen = SectionCandidateGenerator(self.llm, self.config)
        self.cand_merge = CandidateMerger(self.llm, self.config)
        self.retriever = HybridEvidenceRetriever(self.config, Embedder(self.config.embedding))
        self.extractor = ItemExtractorLLM(self.llm, self.config)
        self.post = ItemPostProcessor()
        self.store = ItemsStorage(self.config)

    def run(self, paper_id: str) -> Dict[str, object]:
        print(f"[blocks_to_items] start paper_id={paper_id}")
        sections = self.doc_store.load_sections(paper_id)
        blocks = self.doc_store.load_blocks(paper_id)
        sections = sections[:2]
        print(f"[blocks_to_items] sections={len(sections)} blocks={len(blocks)}")

        print("[blocks_to_items] stage A: candidates per section")
        candidates = self.cand_gen.generate(sections, blocks)
        print(f"[blocks_to_items] candidates={len(candidates)}")

        if candidates:
            print("[blocks_to_items] stage A: merge")
            candidates = self.cand_merge.merge(candidates)
            print(f"[blocks_to_items] merged_candidates={len(candidates)}")

        items: List[Dict[str, object]] = []
        for idx, cand in enumerate(candidates, start=1):
            cid = cand.candidate_id
            print(f"[blocks_to_items] candidate {idx}/{len(candidates)}: {cid}")
            evidence = self.retriever.retrieve(paper_id, cand, blocks)
            print(f"[blocks_to_items] evidence_blocks={len(evidence)}")
            item = self.extractor.extract(cand, evidence)
            if isinstance(item, dict):
                # unwrap if extractor returns {drop, item}
                if item.get("drop") is True:
                    continue
                if "item" in item and isinstance(item.get("item"), dict):
                    items.append(item["item"])
                else:
                    items.append(item)

        print(f"[blocks_to_items] items={len(items)}")
        normalized = self.post.normalize_and_filter(items)
        print(f"[blocks_to_items] normalized_items={len(normalized)}")

        self.store.store(paper_id, normalized)
        print("[blocks_to_items] stored items")
        return {"paper_id": paper_id, "items": normalized}
