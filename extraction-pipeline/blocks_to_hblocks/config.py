from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class NoiseConfig:
    min_text_len: int = 20
    drop_noise: bool = True
    allow_short_types: List[str] = field(default_factory=lambda: [
        "title",
        "section_title",
        "figure_caption",
        "table_label",
        "equation",
    ])


@dataclass(frozen=True)
class LinkConfig:
    emit_links: bool = False
    emit_next_prev: bool = True
    emit_same_section: bool = True


@dataclass(frozen=True)
class CandidateConfig:
    enable: bool = True
    keyword_hits: int = 1
    keywords: List[str] = field(default_factory=lambda: [
        "method",
        "assay",
        "experiment",
        "result",
        "protocol",
        "incubation",
        "centrifuge",
        "binding",
        "expression",
        "quantification",
    ])


@dataclass(frozen=True)
class HBlocksConfig:
    noise: NoiseConfig = field(default_factory=NoiseConfig)
    links: LinkConfig = field(default_factory=LinkConfig)
    candidates: CandidateConfig = field(default_factory=CandidateConfig)

    metadata_fields: Dict[str, str] = field(default_factory=lambda: {
        "paper_id": "paper_id",
        "grobid_id": "grobid_id",
    })
