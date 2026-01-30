from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import requests
import spacy
from qdrant_client.models import PointStruct

from storage.astra.client import AstraClientFactory
from storage.qdrant.client import QdrantClientFactory
from storage.papers_data import fetch_paper_data

from structure_to_blocks.config import StructureToBlocksConfig
from structure_to_blocks.embedder import Embedder
from structure_to_blocks.hashing import text_hash
from structure_to_blocks.summarizer import SectionSummarizer


_NLP = None


def _get_nlp():
    global _NLP
    if _NLP is None:
        nlp = spacy.blank("en")
        nlp.add_pipe("sentencizer")
        _NLP = nlp
    return _NLP


def _chunk_sentences(text: str, max_chars: int, overlap_sentences: int) -> List[str]:
    if not text:
        return []
    if max_chars <= 0:
        return [text]

    nlp = _get_nlp()
    doc = nlp(text)
    sentences = [s.text.strip() for s in doc.sents if s.text.strip()]
    if not sentences:
        return [text]

    chunks: List[str] = []
    current: List[str] = []
    current_len = 0
    for sent in sentences:
        if current and current_len + len(sent) + 1 > max_chars:
            chunks.append(" ".join(current))
            if overlap_sentences > 0:
                current = current[-overlap_sentences:]
                current_len = sum(len(s) for s in current) + max(0, len(current) - 1)
            else:
                current = []
                current_len = 0
        if not current:
            current = [sent]
            current_len = len(sent)
        else:
            current.append(sent)
            current_len += len(sent) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks


@dataclass
class StructureToBlocks:
    config: StructureToBlocksConfig = StructureToBlocksConfig()

    def run(self, paper_hash: str, *, store_astra: bool = True, store_qdrant: bool = True) -> Dict[str, object]:
        print(f"[structure_to_blocks] start paper_hash={paper_hash}")
        paper_data = fetch_paper_data(paper_hash)
        if not paper_data:
            raise ValueError("paper_hash not found in papers_data")

        uploads = paper_data.get("uploads")
        if not isinstance(uploads, list):
            raise ValueError("paper_json missing uploads list")

        print(f"[structure_to_blocks] found uploads={len(uploads)}")
        structure_url = _find_upload_url(uploads, f"[{paper_hash}]structure.json")
        metadata_url = _find_upload_url(uploads, f"[{paper_hash}]metadata.json")

        if not structure_url:
            raise ValueError("structure.json upload not found")

        print(f"[structure_to_blocks] downloading structure.json")
        structure = _download_json(structure_url)
        print(f"[structure_to_blocks] downloading metadata.json")
        metadata = _download_json(metadata_url) if metadata_url else {}

        paper_uuid = _paper_uuid(paper_hash)
        print(f"[structure_to_blocks] paper_uuid={paper_uuid}")
        print("[structure_to_blocks] building blocks/sections from structure")
        table_texts = _load_table_texts(uploads, paper_hash)
        sections, blocks = _build_blocks_from_structure(structure, paper_hash, table_texts)
        print(f"[structure_to_blocks] built sections={len(sections)} blocks={len(blocks)}")
        print("[structure_to_blocks] summarizing sections")
        section_summary_map = SectionSummarizer(self.config).summarize(blocks, sections)
        if sections:
            pct = (len(section_summary_map) / max(1, len(sections))) * 100.0
            print(f"[structure_to_blocks] summaries={len(section_summary_map)} ({pct:.1f}%)")
        sections = _attach_section_summaries(sections, section_summary_map)

        print("[structure_to_blocks] building paper summary (abstract)")
        paper = _build_paper_summary(paper_hash, paper_uuid, sections, blocks, metadata)
        out = {
            "paper": paper,
            "sections": sections,
            "blocks": blocks,
        }

        if store_astra:
            print("[structure_to_blocks] storing to Astra")
            self._store_astra(paper_hash, paper, sections, blocks)
        if store_qdrant:
            print("[structure_to_blocks] storing to Qdrant")
            self._store_qdrant(paper_hash, paper, sections, blocks)
        print("[structure_to_blocks] done")
        return out

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
            for b in blocks:
                block_id = str(b.get("block_id"))
                section_id = str(b.get("section_id"))
                text = str(b.get("text") or "")
                session.execute(
                    f"INSERT INTO {cfg.astra_blocks} "
                    "(paper_id, block_id, section_id, type, section_path, text, text_hash, source, "
                    "block_index, section_index, flags) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        block_id,
                        section_id,
                        b.get("type"),
                        b.get("section_path") or [],
                        text,
                        text_hash(text),
                        json.dumps(b.get("source") or {}),
                        b.get("block_index"),
                        b.get("section_index"),
                        json.dumps(b.get("flags") or {}),
                    ),
                )

            for s in sections:
                section_id = str(s.get("section_id"))
                section_title = s.get("title") or s.get("section_title")
                summary = s.get("summary") or ""
                session.execute(
                    f"INSERT INTO {cfg.astra_sections} "
                    "(paper_id, section_id, section_title, summary, summary_chars, source_block_count, block_ids) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        section_id,
                        section_title,
                        summary,
                        len(summary),
                        s.get("source_block_count"),
                        s.get("block_ids") or [],
                    ),
                )

            if paper:
                summary = paper.get("summary") or ""
                session.execute(
                    f"INSERT INTO {cfg.astra_papers} "
                    "(paper_id, paper_uuid, title, authors, summary, summary_chars, source_section_count, metadata) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        paper.get("paper_uuid"),
                        paper.get("title"),
                        paper.get("authors") or [],
                        summary,
                        len(summary),
                        paper.get("source_section_count"),
                        json.dumps(paper.get("metadata") or {}),
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
    ) -> None:
        cfg = self.config.storage
        client = QdrantClientFactory().create()
        embedder = Embedder(self.config.embedding)

        texts: List[str] = []
        block_meta = []
        for b in blocks:
            text = str(b.get("text") or "")
            if not text:
                continue
            texts.append(text)
            block_meta.append(b)

        vectors = embedder.embed(texts) if texts else []
        points = []
        for b, v in zip(block_meta, vectors):
            block_id = str(b.get("block_id"))
            section_id = str(b.get("section_id"))
            payload = {
                "block_id": block_id,
                "paper_id": paper_id,
                "section_id": section_id,
                "type": b.get("type"),
                "text_hash": text_hash(b.get("text") or ""),
                "block_index": b.get("block_index"),
            }
            pid = block_id
            points.append(PointStruct(id=pid, vector=v, payload=payload))
        if points:
            batch = max(1, int(cfg.qdrant_upsert_batch_size))
            for i in range(0, len(points), batch):
                client.upsert(collection_name=cfg.qdrant_blocks, points=points[i : i + batch])

        section_texts = [str(s.get("summary") or "") for s in sections if s.get("summary")]
        sections_with_summary = [s for s in sections if s.get("summary")]
        vectors = embedder.embed(section_texts) if section_texts else []
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
            pid = section_id
            points.append(PointStruct(id=pid, vector=v, payload=payload))
        if points:
            client.upsert(collection_name=cfg.qdrant_sections, points=points)

        if paper and paper.get("summary"):
            summary = str(paper.get("summary") or "")
            title = str(paper.get("title") or "")
            paper_text = f"{title}\n\n{summary}".strip()
            vector = embedder.embed([paper_text])[0]
            payload = {
                "paper_id": paper_id,
                "paper_uuid": paper.get("paper_uuid"),
                "title": paper.get("title"),
                "summary_chars": len(summary),
            }
            pid = str(paper.get("paper_uuid"))
            client.upsert(collection_name=cfg.qdrant_papers, points=[PointStruct(id=pid, vector=vector, payload=payload)])


def _find_upload_url(uploads: List[Dict[str, object]], name: str) -> Optional[str]:
    for u in uploads:
        if not isinstance(u, dict):
            continue
        if u.get("path") == name:
            return u.get("url")
    return None


def _download_json(url: str) -> Dict[str, object]:
    resp = requests.get(url, timeout=None)
    resp.raise_for_status()
    return resp.json()


def _build_blocks_from_structure(
    structure: Dict[str, object], paper_id: str, table_texts: List[str]
) -> Tuple[List[Dict[str, object]], List[Dict[str, object]]]:
    sections_out: List[Dict[str, object]] = []
    blocks_out: List[Dict[str, object]] = []

    sections = structure.get("sections") if isinstance(structure, dict) else None
    if not isinstance(sections, list):
        return sections_out, blocks_out

    for s_idx, sec in enumerate(sections, start=1):
        if not isinstance(sec, dict):
            continue
        title = sec.get("title") or sec.get("section_title") or ""
        section_id = _stable_uuid(paper_id, f"section::{s_idx}::{title}")
        block_ids: List[str] = []
        blocks = sec.get("blocks") or []
        block_index = 0
        for b in blocks:
            if not isinstance(b, dict):
                continue
            block_index += 1
            block_id = _stable_uuid(paper_id, f"{section_id}::block::{block_index}")
            kind = b.get("kind")
            label = b.get("label")
            text = _extract_block_text(b, kind=kind, label=label, table_texts=table_texts)
            if not text:
                continue
            block = {
                "block_id": block_id,
                "section_id": section_id,
                "section_path": [title] if title else [],
                "type": _map_block_type(kind, label),
                "text": text,
                "block_index": block_index,
                "section_index": s_idx,
                "source": {"kind": kind, "label": label, "prov": b.get("prov"), "ref": b.get("ref")},
                "flags": {},
            }
            blocks_out.append(block)
            block_ids.append(block_id)

        sections_out.append(
            {
                "section_id": section_id,
                "title": title,
                "section_path": [title] if title else [],
                "source_block_count": len(block_ids),
                "block_ids": block_ids,
            }
        )

    return sections_out, blocks_out


def _extract_block_text(
    block: Dict[str, object],
    *,
    kind: Optional[str],
    label: Optional[str],
    table_texts: List[str],
) -> str:
    if kind == "table":
        if table_texts:
            return table_texts.pop(0)
        return ""
    if kind == "picture":
        caption = block.get("caption")
        if isinstance(caption, list):
            joined = " ".join([str(c).strip() for c in caption if str(c).strip()]).strip()
            if joined:
                return f"CAPTION: {joined}"
        return ""
    text = block.get("text")
    if isinstance(text, str) and text.strip():
        return text.strip()
    return ""


def _map_block_type(kind: Optional[str], label: Optional[str]) -> str:
    if kind == "table":
        return "table"
    if kind == "picture":
        return "figure"
    return "text"


def _load_table_texts(uploads: List[Dict[str, object]], paper_hash: str) -> List[str]:
    table_entries = []
    for u in uploads:
        if not isinstance(u, dict):
            continue
        path = str(u.get("path") or "")
        url = u.get("url")
        if not url:
            continue
        if path.startswith(f"[{paper_hash}]table_") and path.endswith(".csv"):
            table_entries.append((path, url))
    table_entries.sort(key=lambda x: x[0])
    out: List[str] = []
    for _, url in table_entries:
        try:
            resp = requests.get(url, timeout=None)
            resp.raise_for_status()
            out.append(resp.text)
        except Exception:
            out.append("")
    return out


def _attach_section_summaries(
    sections: List[Dict[str, object]], summaries: Dict[str, str]
) -> List[Dict[str, object]]:
    out: List[Dict[str, object]] = []
    for s in sections:
        sid = s.get("section_id")
        merged = dict(s)
        if sid in summaries:
            merged["summary"] = summaries[sid]
        out.append(merged)
    return out


def _build_paper_summary(
    paper_id: str,
    paper_uuid: str,
    sections: List[Dict[str, object]],
    blocks: List[Dict[str, object]],
    metadata: Dict[str, object],
) -> Dict[str, object]:
    abstract_section_ids = [
        s.get("section_id")
        for s in sections
        if isinstance(s.get("title"), str) and s.get("title").strip().lower() == "abstract"
    ]
    abstract_texts = []
    if abstract_section_ids:
        for b in blocks:
            if b.get("section_id") in abstract_section_ids:
                abstract_texts.append(str(b.get("text") or ""))
    abstract_summary = " ".join(t.strip() for t in abstract_texts if t.strip())
    title = metadata.get("title") if isinstance(metadata, dict) else None
    authors_raw = metadata.get("authors") if isinstance(metadata, dict) else None
    authors: List[str] = []
    if isinstance(authors_raw, list):
        for a in authors_raw:
            if isinstance(a, str):
                if a.strip():
                    authors.append(a.strip())
            elif isinstance(a, dict):
                name = a.get("name")
                if isinstance(name, str) and name.strip():
                    authors.append(name.strip())
                else:
                    parts = [a.get("forename"), a.get("surname")]
                    joined = " ".join(p for p in parts if isinstance(p, str) and p.strip()).strip()
                    if joined:
                        authors.append(joined)

    return {
        "paper_id": paper_id,
        "paper_uuid": paper_uuid,
        "title": title,
        "authors": authors,
        "summary": abstract_summary,
        "summary_chars": len(abstract_summary),
        "source_section_count": len(abstract_section_ids) or 0,
        "metadata": metadata,
    }


def _stable_uuid(paper_id: str, seed: str) -> str:
    raw = f"{paper_id}::{seed}"
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, raw))


def _paper_uuid(paper_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"paper::{paper_id}"))
