from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Block:
    block_id: str
    section_id: str
    type: str
    text: str
    block_index: int


@dataclass
class Section:
    section_id: str
    title: str
    summary: Optional[str]


@dataclass
class Candidate:
    candidate_id: str
    section_id: Optional[str]
    label: Optional[str]
    summary: Optional[str]
    evidence_hints: List[str]
    proposed_item_kind: Optional[str]
    anchors: List[str]
    source_block_ids: List[str]


@dataclass
class EvidenceBlock:
    block_id: str
    section_id: Optional[str]
    type: Optional[str]
    text: Optional[str]
