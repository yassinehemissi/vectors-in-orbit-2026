from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

from qdrant_client.models import PointStruct

from storage.astra import AstraClientFactory
from storage.qdrant import QdrantClientFactory

from .config import HBlocksToStorageConfig
from .embedder import Embedder
from .hashing import text_hash, vector_id


@dataclass
class HBlocksToStorage:
    config: HBlocksToStorageConfig = HBlocksToStorageConfig()

    def store(
        self,
        hblocks: Dict[str, object],
        *,
        store_astra: bool = True,
        store_qdrant: bool = True,
        embed_blocks: bool = True,
        embed_sections: bool = True,
        embed_papers: bool = True,
    ) -> None:
        paper_id = self._paper_id(hblocks)
        if not paper_id:
            raise ValueError("Missing paper_id in hblocks meta/paper")

        sections = hblocks.get("sections", []) if isinstance(hblocks.get("sections"), list) else []
        blocks = hblocks.get("blocks", []) if isinstance(hblocks.get("blocks"), list) else []
        paper = hblocks.get("paper", {}) if isinstance(hblocks.get("paper"), dict) else {}

        if store_qdrant:
            self._store_qdrant(paper_id, paper, sections, blocks, embed_blocks, embed_sections, embed_papers)

        if store_astra:
            self._store_astra(paper_id, paper, sections, blocks)

    def _paper_id(self, hblocks: Dict[str, object]) -> Optional[str]:
        if isinstance(hblocks.get("paper"), dict):
            pid = hblocks["paper"].get("paper_id")
            if pid:
                return str(pid)
        if isinstance(hblocks.get("meta"), dict):
            pid = hblocks["meta"].get("paper_id")
            if pid:
                return str(pid)
        return None

    def _store_astra(
        self,
        paper_id: str,
        paper: Dict[str, object],
        sections: List[Dict[str, object]],
        blocks: List[Dict[str, object]],
    ) -> None:
        cfg = self.config.storage
        cluster, session = AstraClientFactory().create()
        try:
            # blocks
            for b in blocks:
                block_id = str(b.get("block_id"))
                section_id = str(b.get("section_id"))
                text = str(b.get("text") or "")
                session.execute(
                    f"INSERT INTO {cfg.astra_blocks} (paper_id, block_id, section_id, type, section_path, text, text_hash, source, chunk, block_index, section_index, flags) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        block_id,
                        section_id,
                        b.get("type"),
                        b.get("section_path") or [],
                        text,
                        text_hash(text),
                        json.dumps(b.get("source") or {}),
                        b.get("chunk"),
                        b.get("block_index"),
                        b.get("section_index"),
                        json.dumps(b.get("flags") or {}),
                    ),
                )
                session.execute(
                    f"INSERT INTO {cfg.astra_by_section} (paper_id, section_id, block_id, type, text, block_index) VALUES (%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        section_id,
                        block_id,
                        b.get("type"),
                        text,
                        b.get("block_index"),
                    ),
                )

            # sections
            for s in sections:
                section_id = str(s.get("section_id"))
                section_title = s.get("title") or s.get("section_title")
                summary = s.get("summary") or ""
                session.execute(
                    f"INSERT INTO {cfg.astra_sections} (paper_id, section_id, section_title, summary, summary_chars, source_block_count) VALUES (%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        section_id,
                        section_title,
                        summary,
                        len(summary),
                        s.get("source_block_count"),
                    ),
                )

            # paper
            if paper:
                summary = paper.get("summary") or ""
                session.execute(
                    f"INSERT INTO {cfg.astra_papers} (paper_id, title, paper_url, summary, summary_chars, source_section_count) VALUES (%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        paper.get("title"),
                        paper.get("paper_url"),
                        summary,
                        len(summary),
                        paper.get("source_section_count"),
                    ),
                )
        finally:
            cluster.shutdown()

    def _store_qdrant(
        self,
        paper_id: str,
        paper: Dict[str, object],
        sections: List[Dict[str, object]],
        blocks: List[Dict[str, object]],
        embed_blocks: bool,
        embed_sections: bool,
        embed_papers: bool,
    ) -> None:
        cfg = self.config.storage
        client = QdrantClientFactory().create()
        embedder = Embedder(self.config.embedding)

        if embed_blocks:
            texts = [str(b.get("text") or "") for b in blocks]
            vectors = embedder.embed(texts) if texts else []
            points = []
            for b, v in zip(blocks, vectors):
                block_id = str(b.get("block_id"))
                section_id = str(b.get("section_id"))
                text = str(b.get("text") or "")
                payload = {
                    "block_id": block_id,
                    "paper_id": paper_id,
                    "section_id": section_id,
                    "type": b.get("type"),
                    "chunk": b.get("chunk"),
                    "text_hash": text_hash(text),
                    "block_index": b.get("block_index"),
                }
                pid = vector_id(paper_id, block_id)
                points.append(PointStruct(id=pid, vector=v, payload=payload))
            if points:
                client.upsert(collection_name=cfg.qdrant_blocks, points=points)

        if embed_sections:
            texts = [str(s.get("summary") or "") for s in sections if s.get("summary")]
            sections_with_summary = [s for s in sections if s.get("summary")]
            vectors = embedder.embed(texts) if texts else []
            points = []
            for s, v in zip(sections_with_summary, vectors):
                section_id = str(s.get("section_id"))
                summary = str(s.get("summary") or "")
                payload = {
                    "section_id": section_id,
                    "paper_id": paper_id,
                    "section_title": s.get("title") or s.get("section_title"),
                    "summary_chars": len(summary),
                }
                pid = vector_id(paper_id, section_id)
                points.append(PointStruct(id=pid, vector=v, payload=payload))
            if points:
                client.upsert(collection_name=cfg.qdrant_sections, points=points)

        if embed_papers and paper:
            summary = str(paper.get("summary") or "")
            if summary:
                vector = embedder.embed([summary])[0]
                payload = {
                    "paper_id": paper_id,
                    "title": paper.get("title"),
                    "paper_url": paper.get("paper_url"),
                    "summary_chars": len(summary),
                }
                pid = vector_id(paper_id)
                client.upsert(
                    collection_name=cfg.qdrant_papers,
                    points=[PointStruct(id=pid, vector=vector, payload=payload)],
                )
