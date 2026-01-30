from __future__ import annotations

from dataclasses import dataclass
from typing import List

from storage.astra.client import AstraClientFactory

from .config import StorageConfig
from .models import Block, Section


@dataclass
class AstraDocumentStore:
    config: StorageConfig

    def load_sections(self, paper_id: str) -> List[Section]:
        cluster, session = AstraClientFactory().create()
        try:
            rows = session.execute(
                f"SELECT section_id, section_title, summary FROM {self.config.astra_sections} WHERE paper_id = %s",
                (paper_id,),
            )
            return [Section(r.section_id, r.section_title, r.summary) for r in rows]
        finally:
            cluster.shutdown()

    def load_blocks(self, paper_id: str) -> List[Block]:
        cluster, session = AstraClientFactory().create()
        try:
            rows = session.execute(
                f"SELECT block_id, section_id, type, text, block_index FROM {self.config.astra_blocks} WHERE paper_id = %s",
                (paper_id,),
            )
            return [Block(r.block_id, r.section_id, r.type, r.text, r.block_index) for r in rows]
        finally:
            cluster.shutdown()
