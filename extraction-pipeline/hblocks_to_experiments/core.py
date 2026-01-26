from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional

from openai import OpenAI
from qdrant_client.models import Filter, FieldCondition, MatchValue

from storage.astra import AstraClientFactory
from storage.qdrant import QdrantClientFactory

from .config import HBlocksToExperimentsConfig

from .embedder import Embedder


def _safe_json(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        return {}


def _normalize(s: str) -> str:
    if s is None:
        return ""
    if isinstance(s, list):
        s = " ".join(str(x) for x in s)
    return re.sub(r"\s+", " ", str(s).strip().lower())


def _debug_write(name: str, payload: object) -> None:
    debug_dir = os.getenv("HBLOCKS_DEBUG_DIR")
    if not debug_dir:
        return
    os.makedirs(debug_dir, exist_ok=True)
    path = os.path.join(debug_dir, name)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False))
        f.write("\n")


@dataclass
class HBlocksToExperiments:
    config: HBlocksToExperimentsConfig = HBlocksToExperimentsConfig()

    def run(self, paper_id: str) -> Dict[str, object]:
        sections = self._load_section_summaries(paper_id)
        _debug_write("stage_a_sections.jsonl", {"paper_id": paper_id, "sections": sections})
        augmentation = self._build_augmentation(sections)
        _debug_write("stage_a_augmentation.jsonl", {"paper_id": paper_id, "augmentation": augmentation})
        candidates = self._stage_a_candidates(sections)
        _debug_write("stage_a_candidates.jsonl", {"paper_id": paper_id, "candidates": candidates})
        experiments = []
        for c in candidates:
            print(c["experiment_id"])
            ev = self._stage_b_evidence(paper_id, c)
            _debug_write("stage_b_evidence.jsonl", {"paper_id": paper_id, "candidate": c, "evidence": ev})
            ex = self._stage_c_extract(c, ev, augmentation)
            _debug_write("stage_c_extraction.jsonl", {"paper_id": paper_id, "candidate": c, "extraction": ex})
            experiments.append(ex)

        deduped = self._stage_e_dedup(experiments)
        _debug_write("stage_e_dedup.jsonl", {"paper_id": paper_id, "deduped": deduped})

        return {
            "paper_id": paper_id,
            "experiments": deduped,
        }

    def _client(self) -> OpenAI:
        cfg = self.config.openai
        api_key = os.getenv(cfg.api_key_env)
        if not api_key:
            raise ValueError(f"Missing {cfg.api_key_env}")
        base_url = os.getenv(cfg.base_url_env) or cfg.base_url_default
        return OpenAI(api_key=api_key, base_url=base_url or None)

    def _load_section_summaries(self, paper_id: str) -> List[Dict[str, object]]:
        cluster, session = AstraClientFactory().create()
        try:
            rows = session.execute(
                "SELECT section_id, section_title, summary FROM \"Experimentein\".hblocks_sections WHERE paper_id = %s",
                (paper_id,),
            )
            return [
                {
                    "section_id": r.section_id,
                    "section_title": r.section_title,
                    "summary": r.summary,
                }
                for r in rows
            ]
        finally:
            cluster.shutdown()

    def _stage_a_candidates(self, sections: List[Dict[str, object]]) -> List[Dict[str, object]]:
        client = self._client()
        payload = {
    "sections": sections,  # list of {section_id, title, path, ...}
    "instruction": (
        "TASK: Propose candidate experiments present in THIS paper only.\n"
        "You MUST ground each experiment in the provided sections list.\n\n"

        "RULES:\n"
        "1) Do NOT invent datasets, metrics, baselines, or methods not implied by section titles.\n"
        "2) Prefer paper-specific experiment axes (benchmarking, ablation, generalization, inference efficiency, "
        "pocket prediction evaluation, iterative refinement, apo/holo settings) when applicable.\n"
        "3) predicted_source_sections must be a list of section_id values from the provided sections.\n"
        "4) Return 3-8 experiments. Avoid duplicates.\n"
        "5) Titles must include at least one anchor term if possible (e.g., RMSD, DCC, PDBBind, unseen protein, "
        "inference efficiency, ablation, iterative refinement).\n\n"

        "OUTPUT: Return STRICT JSON only (no markdown, no comments) as a list of objects. "
        "Each object must contain exactly these keys:\n"
        "- experiment_id (string like 'e_1')\n"
        "- experiment_type (one of: benchmark, ablation, efficiency, generalization, analysis, case_study)\n"
        "- title (paper-specific)\n"
        "- goal_or_hypothesis (1 sentence)\n"
        "- needed_evidence_types (list of strings)\n"
        "- predicted_source_sections (list of section_id strings)\n"
        "- confidence (0.0-1.0)\n"
        "- missing_expected (string; what you expect but may be absent)\n"
        "- anchors (list of 3-8 short keywords for retrieval)\n"
    )
    }

        resp = client.chat.completions.create(
        model=self.config.openai.model,
        messages=[
            {
            "role": "system",
            "content": (
                "You are an experiment discovery engine for scientific papers.\n"
                "You must ONLY use the sections provided by the user.\n"
                "Return STRICT JSON only.\n"
                "Do not add any keys not requested.\n"
                "Do not include markdown or explanations.\n"
            )
            },
            {"role": "user", "content": json.dumps(payload)}
        ],
        temperature=0.2,
        timeout=self.config.openai.timeout_sec,
        )
        raw = resp.choices[0].message.content or ""
        _debug_write("stage_a_raw.jsonl", {"raw": raw})
        data = _safe_json(raw)
        _debug_write("stage_a_parsed.jsonl", {"parsed": data})
        print(data);
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            exps = data.get("experiments")
            return exps if isinstance(exps, list) else []
        return []

    def _stage_b_evidence(self, paper_id: str, candidate: Dict[str, object]) -> List[Dict[str, object]]:
        cfg = self.config.retrieval
        section_ids = candidate.get("predicted_source_sections") or []
        section_ids = [s for s in section_ids if s]

        blocks = self._astra_blocks_by_sections(paper_id, section_ids)

        # Optional Qdrant precision step
        if cfg.use_qdrant:
            blocks = self._qdrant_refine(paper_id, candidate, blocks)

        # Expand context around each block
        expanded = self._expand_blocks(paper_id, blocks, cfg.expand_window)

        # Cap by budget
        packed = []
        total_chars = 0
        for b in expanded:
            text = b.get("text") or ""
            if total_chars + len(text) > cfg.max_chars_per_candidate:
                break
            packed.append(b)
            total_chars += len(text)
            if len(packed) >= cfg.max_blocks_per_candidate:
                break
        return packed

    def _astra_blocks_by_sections(self, paper_id: str, section_ids: List[str]) -> List[Dict[str, object]]:
        if not section_ids:
            return []
        cluster, session = AstraClientFactory().create()
        try:
            out: List[Dict[str, object]] = []
            for sid in section_ids:
                rows = session.execute(
                    "SELECT block_id, type, text, block_index, section_id FROM \"Experimentein\".hblocks_by_section WHERE paper_id = %s AND section_id = %s",
                    (paper_id, sid),
                )
                for r in rows:
                    out.append(
                        {
                            "block_id": r.block_id,
                            "type": r.type,
                            "text": r.text,
                            "block_index": r.block_index,
                            "section_id": r.section_id,
                        }
                    )
            return out
        finally:
            cluster.shutdown()

    def _qdrant_refine(self, paper_id: str, candidate: Dict[str, object], blocks: List[Dict[str, object]]) -> List[Dict[str, object]]:
        query = " ".join(
            [
                candidate.get("goal_or_hypothesis") or "",
                " ".join(candidate.get("needed_evidence_types") or []),
                " ".join(candidate.get("missing_expected") or []),
            ]
        ).strip()
        if not query:
            return blocks

        embedder = Embedder(self.config.embedding)
        vector = embedder.embed([query])[0]

        client = QdrantClientFactory().create()
        flt = Filter(
            must=[
                FieldCondition(key="paper_id", match=MatchValue(value=paper_id)),
            ]
        )
        res = client.query_points(
            collection_name="hblocks_blocks",
            query=vector,
            limit=self.config.retrieval.qdrant_top_k,
            with_payload=True,
            query_filter=flt,
        )
        ids = {p.payload.get("block_id") for p in res.points if p.payload}
        if not ids:
            return blocks
        return [b for b in blocks if b.get("block_id") in ids]

    def _expand_blocks(self, paper_id: str, blocks: List[Dict[str, object]], window: int) -> List[Dict[str, object]]:
        if not blocks or window <= 0:
            return blocks
        cluster, session = AstraClientFactory().create()
        try:
            expanded: Dict[str, Dict[str, object]] = {b["block_id"]: b for b in blocks}
            for b in blocks:
                section_id = b.get("section_id")
                idx = b.get("block_index")
                if section_id is None or idx is None:
                    continue
                for offset in range(-window, window + 1):
                    if offset == 0:
                        continue
                    target = idx + offset
                    rows = session.execute(
                        "SELECT block_id, type, text, block_index, section_id FROM \"Experimentein\".hblocks_by_section WHERE paper_id = %s AND section_id = %s AND block_index = %s",
                        (paper_id, section_id, target),
                    )
                    for r in rows:
                        expanded.setdefault(
                            r.block_id,
                            {
                                "block_id": r.block_id,
                                "type": r.type,
                                "text": r.text,
                                "block_index": r.block_index,
                                "section_id": r.section_id,
                            },
                        )
            return list(expanded.values())
        finally:
            cluster.shutdown()

    def _stage_c_extract(self, candidate: Dict[str, object], evidence: List[Dict[str, object]], augmentation: Dict[str, object]) -> Dict[str, object]:
        client = self._client()
        payload = {
        "candidate": candidate,
        "evidence": evidence,
        "augmentation": augmentation,
        "instruction": (
            "TASK: Extract ONE experiment using ONLY the provided evidence blocks.\n"
            "You may INFER the TITLE if not explicit; all other fields must be evidence-backed.\n\n"

            "HARD RULES (MUST FOLLOW):\n"
            "1) Use ONLY evidence blocks as ground truth. The candidate is NOT evidence.\n"
            "   - You may use candidate only to choose what to look for, but every extracted value must be supported by evidence blocks.\n"
            "2) Output MUST be strict JSON only. No markdown, no prose.\n"
            "3) Return exactly ONE object with ALL schema keys.\n"
            "4) For every field:\n"
            "   - If supported explicitly by evidence: fill it.\n"
            "   - If NOT explicitly supported: set it to null AND add the field name to missing.\n"
            "   - EXCEPT for title: if not explicit, infer from candidate and do NOT mark missing.\n"
            "5) NO invention: do not infer, generalize, or paraphrase beyond what is stated.\n"
            "   - Prefer short, literal phrasing from evidence.\n"
            "6) evidence for fields MUST be inline in each field object (value + evidence + confidence).\n"
            "   - BLOCK_IDs must start with 'b_' (e.g., 'b_123...').\n"
            "   - NEVER output section ids ('s_...') or any other ids.\n"
            "7) Consistency rules:\n"
            "   - Every field listed in missing MUST have value null.\n"
            "   - Every null field (except title) MUST be listed in missing.\n"
            "8) Metrics must be metric NAMES only (e.g., 'RMSD', 'DCC', 'inference time').\n"
            "    - Put numeric values / speedups / comparisons in results or runtime_efficiency.\n"
            "9) baselines: include ONLY explicitly named baseline methods/models from evidence.\n"
            "10) runtime_efficiency: only if evidence includes time/speed/compute; include the concrete claim/value if present.\n\n"

            "OUTPUT SCHEMA (all keys required):\n"
            "{\n"
            "  \"experiment_id\": string,\n"
            "  \"experiment_type\": string,\n"
            "  \"title\": {\"value\": string, \"evidence\": [\"b_...\"], \"confidence\": number},\n"
            "  \"goal\": {\"value\": string|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"setup\": {\"value\": string|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"dataset\": {\"value\": string|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"metrics\": {\"value\": [string]|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"results\": {\"value\": string|[string]|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"baselines\": {\"value\": [string]|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"ablations\": {\"value\": [string]|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"runtime_efficiency\": {\"value\": string|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"limitations\": {\"value\": string|[string]|null, \"evidence\": [\"b_...\"], \"confidence\": number|null},\n"
            "  \"missing\": [string],\n"
            "  \"conflicts\": [\n"
            "    {\"field\": string, \"description\": string, \"conflicting_blocks\": [\"b_...\"]}\n"
            "  ],\n"
            "  \"confidence_overall\": number,\n"
            "  \"confidence_reasons\": [string]\n"
            "}\n\n"

            "FINAL CHECK BEFORE OUTPUT:\n"
            "- No 's_' ids anywhere.\n"
            "- All evidence lists contain only 'b_' ids.\n"
            "- Missing exactly matches fields with null values (except title).\n"
        )
        }

        resp = client.chat.completions.create(
        model=self.config.openai.model,
        messages=[
            {
            "role": "system",
            "content": (
                "You are a strict scientific information extraction engine.\n"
                "Return JSON only.\n"
                "Do not infer or paraphrase; only extract explicitly stated facts.\n"
                "If evidence is insufficient, set fields to null and list them in missing.\n"
                "evidence_map must contain ONLY block ids that start with 'b_'.\n"
            )
            },
            {"role": "user", "content": json.dumps(payload)}
        ],
        temperature=0.2,
        timeout=self.config.openai.timeout_sec,
        )

        raw = resp.choices[0].message.content or ""
        data = _safe_json(raw)

        # Post-process: enforce title inference and missing consistency
        if isinstance(data, dict):
            data.setdefault("experiment_id", candidate.get("experiment_id"))
            data.setdefault("experiment_type", candidate.get("experiment_type"))
            title_obj = data.get("title") or {}
            if not isinstance(title_obj, dict):
                title_obj = {"value": None, "evidence": [], "confidence": None}
            if not title_obj.get("value"):
                title_obj["value"] = candidate.get("title") or f"Experiment {candidate.get('experiment_id')}"
                if "title" in (data.get("missing") or []):
                    data["missing"] = [m for m in data.get("missing") if m != "title"]
            data["title"] = title_obj
            # Ensure experiment_id is never null
            if not data.get("experiment_id"):
                data["experiment_id"] = candidate.get("experiment_id") or f"exp_{candidate.get('title') or 'unknown'}"
            # Ensure title is never null
            if not data.get("title", {}).get("value"):
                data["title"] = {
                    "value": candidate.get("title") or f"Experiment {data['experiment_id']}",
                    "evidence": [],
                    "confidence": None,
                }
        return data

    def _build_augmentation(self, sections: List[Dict[str, object]]) -> Dict[str, object]:
        client = self._client()
        payload = {
            "sections": sections,
            "instruction": (
                "TASK: Build paper-specific extraction hints ONLY.\n"
                "No new facts. No extraction. Return only patterns and vocabulary.\n\n"
                "Return STRICT JSON with keys:\n"
                "- metric_vocab (list of strings)\n"
                "- experiment_type_hints (list of strings)\n"
                "- table_mapping_hints (list of strings)\n"
                "- retrieval_keywords (list of strings)\n"
                "- constraints (list of strings)\n"
            ),
        }
        resp = client.chat.completions.create(
            model=self.config.openai.model,
            messages=[
                {"role": "system", "content": "You generate extraction hints only. JSON only."},
                {"role": "user", "content": json.dumps(payload)},
            ],
            temperature=0.2,
            timeout=self.config.openai.timeout_sec,
        )
        raw = resp.choices[0].message.content or ""
        data = _safe_json(raw)
        return data if isinstance(data, dict) else {}

    def _stage_e_dedup(self, experiments: List[Dict[str, object]]) -> List[Dict[str, object]]:
        seen = {}
        out = []
        for exp in experiments:
            key = "|".join(
                [
                    _normalize((exp.get("dataset") or {}).get("value") if isinstance(exp.get("dataset"), dict) else exp.get("dataset")),
                    _normalize((exp.get("metrics") or {}).get("value") if isinstance(exp.get("metrics"), dict) else exp.get("metrics")),
                    _normalize((exp.get("goal") or {}).get("value") if isinstance(exp.get("goal"), dict) else exp.get("goal")),
                ]
            )
            if key in seen:
                continue
            else:
                exp_id = exp.get("experiment_id") or str(len(seen))
                seen[key] = exp_id
            out.append(exp)
        return out
