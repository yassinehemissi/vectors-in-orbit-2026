from __future__ import annotations

import os
from dataclasses import dataclass
from time import sleep
from typing import Dict, List

from openai import OpenAI

from .config import HBlocksSummarizerConfig


@dataclass
class HBlocksSummarizer:
    config: HBlocksSummarizerConfig = HBlocksSummarizerConfig()

    def summarize(self, hblocks: Dict[str, object]) -> Dict[str, object]:
        sections = hblocks.get("sections", [])
        blocks = hblocks.get("blocks", [])

        if not isinstance(sections, list) or not isinstance(blocks, list):
            raise ValueError("Invalid hblocks schema: expected 'sections' and 'blocks' lists")

        cfg = self.config.summary

        # Group block text by section_id (preferred types first)
        by_section: Dict[str, List[str]] = {}
        by_section_any: Dict[str, List[str]] = {}
        for b in blocks:
            btype = b.get("type")
            section_id = b.get("section_id")
            text = b.get("text")
            if not section_id or not isinstance(text, str) or not text.strip():
                continue
            norm_text = text.strip()
            by_section_any.setdefault(section_id, []).append(norm_text)
            if btype in cfg.include_types:
                by_section.setdefault(section_id, []).append(norm_text)

        summaries: List[Dict[str, object]] = []
        section_summary_map: Dict[str, str] = {}
        k = 0
        for s in sections:
            section_id = s.get("section_id")
            if not section_id:
                continue

            combined = " ".join(by_section.get(section_id, []))
            if not combined:
                # Fallback to any available text in the section
                combined = " ".join(by_section_any.get(section_id, []))
                if not combined:
                    continue

            #if len(combined) > cfg.max_chars_per_section:
            #    combined = combined[: cfg.max_chars_per_section]

            summary = self._summarize_text(
                combined,
                min_words=cfg.min_words,
                max_words=cfg.max_words,
                system_prompt=cfg.system_prompt,
            )
            print(f"Section {section_id} summary: {summary}")
            if k % 5 == 4:
                sleep(10)
            if not summary:
                continue

            entry = {
                "section_id": section_id,
                "summary": summary,
                "source_chars": len(combined),
                "source_block_count": len(by_section.get(section_id, [])),
            }
            summaries.append(entry)
            section_summary_map[section_id] = summary
            k += 1

        # Attach summaries to sections without mutating original objects
        merged_sections = []
        for s in sections:
            sid = s.get("section_id")
            merged = dict(s)
            if sid in section_summary_map:
                merged["summary"] = section_summary_map[sid]
            merged_sections.append(merged)

        paper = self._build_paper_summary(hblocks, sections, section_summary_map)

        out = dict(hblocks)
        out["sections"] = merged_sections
        out["summaries"] = summaries
        if paper:
            out["paper"] = paper
            out["paper_summary"] = paper.get("summary")

        return out

    def _summarize_text(self, text: str, min_words: int, max_words: int, system_prompt: str) -> str:
        cfg = self.config
        api_key = os.getenv(cfg.openrouter.api_key_env)
        if not api_key:
            raise ValueError(f"Missing API key env var: {cfg.openrouter.api_key_env}")

        prompt = (
            f"Summarize the following scientific text. Keep the summary between {min_words} "
            f"and {max_words} words. Focus on methods, settings, and results.\n\n{text}"
        )

        client = OpenAI(
            api_key=api_key,
            base_url=cfg.openrouter.base_url,
        )

        response = client.chat.completions.create(
            model=cfg.openrouter.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            timeout=cfg.openrouter.timeout_sec,
        )

        return response.choices[0].message.content.strip()

    def _build_paper_summary(
        self,
        hblocks: Dict[str, object],
        sections: List[Dict[str, object]],
        section_summary_map: Dict[str, str],
    ) -> Dict[str, object]:
        cfg = self.config.summary

        # Compose paper text from section summaries (title + summary)
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
            return {}

        combined = "\n".join(parts)
        if len(combined) > cfg.max_chars_per_paper:
            combined = combined[: cfg.max_chars_per_paper]

        paper_summary = self._summarize_text(
            combined,
            min_words=cfg.paper_min_words,
            max_words=cfg.paper_max_words,
            system_prompt=cfg.paper_system_prompt,
        )

        # Pull paper metadata from input if present
        paper_meta = hblocks.get("paper", {}) if isinstance(hblocks.get("paper"), dict) else {}
        meta = hblocks.get("meta", {}) if isinstance(hblocks.get("meta"), dict) else {}
        paper_id = paper_meta.get("paper_id") or meta.get("paper_id")
        title = paper_meta.get("title") or meta.get("title")
        paper_url = paper_meta.get("paper_url") or meta.get("paper_url")
        return {
            "paper_id": paper_id,
            "title": title,
            "paper_url": paper_url,
            "summary": paper_summary,
            "summary_chars": len(paper_summary),
            "source_section_count": len(parts),
        }


def summarize_hblocks(hblocks: Dict[str, object]) -> Dict[str, object]:
    return HBlocksSummarizer().summarize(hblocks)
