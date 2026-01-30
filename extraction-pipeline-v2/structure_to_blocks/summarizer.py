from __future__ import annotations

import os
from dataclasses import dataclass
from time import sleep
from typing import Dict, List

from openai import OpenAI

from .config import StructureToBlocksConfig


@dataclass
class SectionSummarizer:
    config: StructureToBlocksConfig = StructureToBlocksConfig()

    def summarize(self, blocks: List[Dict[str, object]], sections: List[Dict[str, object]]) -> Dict[str, str]:
        cfg = self.config.summary
        by_section: Dict[str, List[str]] = {}
        by_section_any: Dict[str, List[str]] = {}

        for b in blocks:
            section_id = b.get("section_id")
            text = b.get("text")
            if not section_id or not isinstance(text, str) or not text.strip():
                continue
            norm = text.strip()
            by_section_any.setdefault(section_id, []).append(norm)
            if b.get("type") in cfg.include_types:
                by_section.setdefault(section_id, []).append(norm)

        summaries: Dict[str, str] = {}
        k = 0
        for s in sections:
            section_id = s.get("section_id")
            if not section_id:
                continue
            combined = " ".join(by_section.get(section_id, []))
            if not combined:
                combined = " ".join(by_section_any.get(section_id, []))
                if not combined:
                    continue
            if len(combined) > cfg.max_chars_per_section:
                combined = combined[: cfg.max_chars_per_section]

            summary = self._summarize_text(
                combined,
                min_words=cfg.min_words,
                max_words=cfg.max_words,
                system_prompt=cfg.system_prompt,
            )
            if k % 19 == 0 and k > 0:
                sleep(40)
            if summary:
                summaries[section_id] = summary
                k += 1
        return summaries

    def summarize_paper(self, sections: List[Dict[str, object]], section_summary_map: Dict[str, str]) -> str:
        cfg = self.config.summary
        parts: List[str] = []
        for s in sections:
            sid = s.get("section_id")
            summary = section_summary_map.get(sid)
            if not summary:
                continue
            title = s.get("title") or s.get("section_title")
            if title:
                parts.append(f"{title}: {summary}")
            else:
                parts.append(summary)

        if not parts:
            return ""
        combined = "\n".join(parts)
        if len(combined) > cfg.max_chars_per_paper:
            combined = combined[: cfg.max_chars_per_paper]

        return self._summarize_text(
            combined,
            min_words=cfg.paper_min_words,
            max_words=cfg.paper_max_words,
            system_prompt=cfg.paper_system_prompt,
        )

    def _summarize_text(self, text: str, min_words: int, max_words: int, system_prompt: str) -> str:
        cfg = self.config.openrouter
        api_key = os.getenv(cfg.api_key_env)
        if not api_key:
            raise ValueError(f"Missing {cfg.api_key_env}")
        client = OpenAI(api_key=api_key, base_url=cfg.base_url, timeout=None)

        prompt = (
            f"Summarize the following scientific text. Keep the summary between {min_words} "
            f"and {max_words} words.\n\n{text}"
        )
        response = client.chat.completions.create(
            model=cfg.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
