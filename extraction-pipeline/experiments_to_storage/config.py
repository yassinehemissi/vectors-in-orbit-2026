from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class EmbeddingConfig:
    model: str = "BAAI/bge-base-en-v1.5"
    batch_size: int = 64


@dataclass(frozen=True)
class StorageConfig:
    qdrant_collection: str = "experiments"
    astra_table: str = "\"Experimentein\".experiments"


@dataclass(frozen=True)
class ExperimentsToStorageConfig:
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    storage: StorageConfig = field(default_factory=StorageConfig)
