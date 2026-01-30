from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from qdrant_client.models import FieldCondition, Filter, MatchValue

from storage.astra.client import AstraClientFactory
from storage.qdrant.client import QdrantClientFactory

from .config import BlocksToItemsConfig
from .embedder import Embedder
from .models import Block, Candidate, EvidenceBlock


@dataclass
class HybridEvidenceRetriever:
    config: BlocksToItemsConfig
    embedder: Embedder

    def retrieve(self, paper_id: str, candidate: Candidate, blocks: List[Block]) -> List[EvidenceBlock]:
        queries = [q for q in (candidate.evidence_hints or []) if q]
        base = " ".join([str(candidate.label or ""), str(candidate.summary or "")]).strip()
        if base:
            queries.append(base)
        if not queries:
            return []

        block_map: Dict[str, Block] = {b.block_id: b for b in blocks}
        out: Dict[str, EvidenceBlock] = {}

        for q in queries:
            vector = self.embedder.embed([q])[0]
            hits = self._query_qdrant(vector, candidate.section_id)
            for p in hits:
                payload = p.payload or {}
                block_id = payload.get("block_id")
                if not block_id:
                    continue
                b = block_map.get(block_id)
                out.setdefault(
                    block_id,
                    EvidenceBlock(
                        block_id=block_id,
                        section_id=(payload.get("section_id") or (b.section_id if b else None)),
                        type=(payload.get("type") or (b.type if b else None)),
                        text=(b.text if b else None),
                    ),
                )

        expanded = self._expand_neighbors(paper_id, list(out.values()))
        return expanded

    def _query_qdrant(self, vector: list[float], section_id: str | None) -> list:
        client = QdrantClientFactory().create()
        flt = None
        if section_id:
            flt = Filter(must=[FieldCondition(key="section_id", match=MatchValue(value=section_id))])
        res = client.query_points(
            collection_name=self.config.storage.qdrant_blocks,
            query=vector,
            limit=self.config.retrieval.top_k,
            with_payload=True,
            query_filter=flt,
        )
        if section_id and len(res.points) < max(3, self.config.retrieval.top_k // 2):
            # fallback global if section-local is too small
            res = client.query_points(
                collection_name=self.config.storage.qdrant_blocks,
                query=vector,
                limit=self.config.retrieval.top_k,
                with_payload=True,
            )
        return res.points

    def _expand_neighbors(self, paper_id: str, evidence_blocks: List[EvidenceBlock]) -> List[EvidenceBlock]:
        if not evidence_blocks:
            return []
        by_section: Dict[str, List[Block]] = {}
        session = AstraClientFactory().create()
        for ev in evidence_blocks:
            if not ev.section_id or ev.section_id in by_section:
                continue
            rows = session.execute(
                "SELECT block_id, section_id, type, text, block_index FROM blocks WHERE paper_id = ? AND section_id = ? ALLOW FILTERING",
                (paper_id, ev.section_id),
            )
            blist = [
                Block(
                    block_id=r.block_id,
                    section_id=r.section_id,
                    type=r.type,
                    text=r.text,
                    block_index=r.block_index,
                )
                for r in rows
            ]
            by_section[ev.section_id] = sorted(blist, key=lambda b: b.block_index)

        expanded: Dict[str, EvidenceBlock] = {b.block_id: b for b in evidence_blocks if b.block_id}
        for ev in evidence_blocks:
            if not ev.section_id:
                continue
            blist = by_section.get(ev.section_id, [])
            if not blist:
                continue
            idx_map = {b.block_id: i for i, b in enumerate(blist)}
            i = idx_map.get(ev.block_id)
            if i is None:
                continue
            for offset in (-1, 1):
                j = i + offset
                if 0 <= j < len(blist):
                    nb = blist[j]
                    expanded.setdefault(
                        nb.block_id,
                        EvidenceBlock(
                            block_id=nb.block_id,
                            section_id=nb.section_id,
                            type=nb.type,
                            text=nb.text,
                        ),
                    )
        return list(expanded.values())
