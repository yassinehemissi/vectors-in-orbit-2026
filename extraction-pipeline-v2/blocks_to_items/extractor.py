from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .config import BlocksToItemsConfig
from .llm_client import LLMClient
from .models import Candidate, EvidenceBlock
from .prompts import extraction_prompt


@dataclass
class ItemExtractorLLM:
    llm: LLMClient
    config: BlocksToItemsConfig

    def extract(self, candidate: Candidate, evidence: list[EvidenceBlock]) -> Optional[dict]:
        evidence_text = "\n".join([e.text or "" for e in evidence if e.text])
        payload = {
            "candidate_id": candidate.candidate_id,
            "item_kind": candidate.proposed_item_kind,
            "label": candidate.label,
            "summary": candidate.summary,
            "anchors": candidate.anchors,
            "predicted_source_sections": [candidate.section_id] if candidate.section_id else [],
        }
        prompt = extraction_prompt(payload, evidence_text)
        data = self.llm.chat_json(
            model=self.config.openai.model_extract,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        if not isinstance(data, dict):
            return None
        if data.get("drop") is True:
            return None
        return data
