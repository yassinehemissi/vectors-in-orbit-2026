from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class EmbeddingConfig:
    model: str = "BAAI/bge-base-en-v1.5"
    batch_size: int = 64


@dataclass(frozen=True)
class StorageConfig:
    qdrant_blocks: str = "hblocks_blocks"
    qdrant_sections: str = "hblocks_sections"
    qdrant_papers: str = "hblocks_papers"

    astra_blocks: str = "\"Experimentein\".hblocks_blocks"
    astra_sections: str = "\"Experimentein\".hblocks_sections"
    astra_papers: str = "\"Experimentein\".hblocks_papers"
    astra_by_section: str = "\"Experimentein\".hblocks_by_section"


@dataclass(frozen=True)
class HBlocksToStorageConfig:
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    storage: StorageConfig = field(default_factory=StorageConfig)
