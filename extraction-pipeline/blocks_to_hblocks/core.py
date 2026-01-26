from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from .config import HBlocksConfig
from .models import HBlock, HBlocksBundle, Link, Section
from .noise import is_noise, normalize_text

# Reuse stable IDs and text normalization from tei-to-blocks to keep consistency.
from tei_to_blocks.text import stable_block_id


def _section_key(path: List[str]) -> Tuple[str, ...]:
    return tuple(path or [])


def _section_id_from_path(path: List[str]) -> str:
    if not path:
        return stable_block_id("section", "root", prefix="s")
    return stable_block_id("section", "||".join(path), prefix="s")


@dataclass
class BlocksToHBlocks:
    config: HBlocksConfig = HBlocksConfig()

    def normalize(
        self,
        blocks: List[Dict[str, object]],
        paper_id: Optional[str] = None,
        emit_links: Optional[bool] = None,
    ) -> Dict[str, object]:
        cfg = self.config
        links_cfg = cfg.links
        emit = links_cfg.emit_links if emit_links is None else emit_links

        allow_short = {t: True for t in cfg.noise.allow_short_types}

        sections_by_key: Dict[Tuple[str, ...], Section] = {}
        section_counts: Dict[str, int] = defaultdict(int)

        out_blocks: List[HBlock] = []
        out_links: List[Link] = []

        last_block_id: Optional[str] = None
        last_by_section: Dict[str, str] = {}

        dropped_noise = 0

        for raw in blocks:
            btype = str(raw.get("type", ""))
            text = normalize_text(str(raw.get("text", "")))
            section_path = raw.get("section_path") or []
            if not isinstance(section_path, list):
                section_path = []

            # Section registration
            skey = _section_key(section_path)
            if skey not in sections_by_key:
                sec_id = _section_id_from_path(list(section_path))
                title = section_path[-1] if section_path else "root"
                parent_id = None
                if len(section_path) > 1:
                    parent_key = _section_key(section_path[:-1])
                    parent = sections_by_key.get(parent_key)
                    if parent:
                        parent_id = parent.section_id
                elif len(section_path) == 1:
                    parent_id = _section_id_from_path([])

                sections_by_key[skey] = Section(
                    section_id=sec_id,
                    path=list(section_path),
                    title=title,
                    parent_id=parent_id,
                    level=len(section_path),
                )

            section = sections_by_key[skey]

            flags = is_noise(text, btype, cfg.noise.min_text_len, allow_short)
            if flags.get("is_noise") and cfg.noise.drop_noise:
                dropped_noise += 1
                continue

            block_index = len(out_blocks)
            section_index = section_counts[section.section_id]
            section_counts[section.section_id] += 1

            block = HBlock(
                block_id=str(raw.get("block_id")),
                type=btype,
                text=text,
                section_id=section.section_id,
                section_path=list(section_path),
                source=dict(raw.get("source") or {}),
                chunk=raw.get("chunk"),
                block_index=block_index,
                section_index=section_index,
                flags=self._build_flags(text, btype, flags),
            )
            out_blocks.append(block)

            if emit and last_block_id and links_cfg.emit_next_prev:
                out_links.append(Link(from_id=last_block_id, to_id=block.block_id, type="next_block"))

            if emit and links_cfg.emit_same_section:
                prev_same = last_by_section.get(section.section_id)
                if prev_same:
                    out_links.append(Link(from_id=prev_same, to_id=block.block_id, type="same_section"))
                last_by_section[section.section_id] = block.block_id

            last_block_id = block.block_id

        meta: Dict[str, object] = {
            "paper_id": paper_id,
            "input_blocks": len(blocks),
            "output_blocks": len(out_blocks),
            "dropped_noise": dropped_noise,
        }

        bundle = HBlocksBundle(
            sections=list(sections_by_key.values()),
            blocks=out_blocks,
            links=out_links if emit else [],
            meta=meta,
        )
        return bundle.to_dict()

    def _build_flags(self, text: str, btype: str, noise_flags: Dict[str, bool]) -> Dict[str, object]:
        flags = dict(noise_flags)
        if self.config.candidates.enable:
            flags["is_experiment_candidate"] = self._is_experiment_candidate(text, btype)
        return flags

    def _is_experiment_candidate(self, text: str, btype: str) -> bool:
        if btype not in {"paragraph", "abstract"}:
            return False
        keywords = self.config.candidates.keywords
        hits = sum(1 for k in keywords if k in text.lower())
        return hits >= self.config.candidates.keyword_hits


def blocks_to_hblocks(
    blocks: List[Dict[str, object]],
    paper_id: Optional[str] = None,
    emit_links: bool = False,
) -> Dict[str, object]:
    return BlocksToHBlocks().normalize(blocks=blocks, paper_id=paper_id, emit_links=emit_links)
