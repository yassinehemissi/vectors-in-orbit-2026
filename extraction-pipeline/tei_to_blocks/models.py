from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Block:
    block_id: str
    type: str
    section_path: List[str]
    text: str
    source: Dict[str, Any]
    chunk: Optional[Dict[str, int]] = None

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "block_id": self.block_id,
            "type": self.type,
            "section_path": list(self.section_path),
            "text": self.text,
            "source": dict(self.source),
        }
        if self.chunk:
            payload["chunk"] = dict(self.chunk)
        return payload


@dataclass
class BlockBuilder:
    blocks: List[Block] = field(default_factory=list)

    def add(self, block: Block) -> None:
        self.blocks.append(block)

    def as_dicts(self) -> List[Dict[str, Any]]:
        return [b.to_dict() for b in self.blocks]
