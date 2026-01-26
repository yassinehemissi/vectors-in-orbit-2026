from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class Section:
    section_id: str
    path: List[str]
    title: str
    parent_id: Optional[str]
    level: int

    def to_dict(self) -> Dict[str, object]:
        return {
            "section_id": self.section_id,
            "path": list(self.path),
            "title": self.title,
            "parent_id": self.parent_id,
            "level": self.level,
        }


@dataclass(frozen=True)
class HBlock:
    block_id: str
    type: str
    text: str
    section_id: str
    section_path: List[str]
    source: Dict[str, object]
    chunk: Optional[Dict[str, int]]
    block_index: int
    section_index: int
    flags: Dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, object]:
        payload: Dict[str, object] = {
            "block_id": self.block_id,
            "type": self.type,
            "text": self.text,
            "section_id": self.section_id,
            "section_path": list(self.section_path),
            "source": dict(self.source),
            "block_index": self.block_index,
            "section_index": self.section_index,
            "flags": dict(self.flags),
        }
        if self.chunk:
            payload["chunk"] = dict(self.chunk)
        return payload


@dataclass(frozen=True)
class Link:
    from_id: str
    to_id: str
    type: str

    def to_dict(self) -> Dict[str, str]:
        return {"from": self.from_id, "to": self.to_id, "type": self.type}


@dataclass
class HBlocksBundle:
    sections: List[Section] = field(default_factory=list)
    blocks: List[HBlock] = field(default_factory=list)
    links: List[Link] = field(default_factory=list)
    meta: Dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, object]:
        return {
            "sections": [s.to_dict() for s in self.sections],
            "blocks": [b.to_dict() for b in self.blocks],
            "links": [l.to_dict() for l in self.links],
            "meta": dict(self.meta),
        }
