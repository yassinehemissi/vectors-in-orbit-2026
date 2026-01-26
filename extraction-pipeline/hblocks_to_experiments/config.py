from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class OpenAIConfig:
    api_key_env: str = "ESPRIT_TOKEN_API_KEY"
    base_url_env: str = "ESPRIT_TOKEN_BASE_URL"
    base_url_default: str = ""
    model: str = "hosted_vllm/Llama-3.1-70B-Instruct"
    timeout_sec: int = 60


@dataclass(frozen=True)
class RetrievalConfig:
    max_blocks_per_candidate: int = 20
    max_chars_per_candidate: int = 12000
    qdrant_top_k: int = 10
    expand_window: int = 2
    use_qdrant: bool = True


@dataclass(frozen=True)
class EmbeddingConfig:
    model: str = "BAAI/bge-base-en-v1.5"
    batch_size: int = 64


@dataclass(frozen=True)
class HBlocksToExperimentsConfig:
    openai: OpenAIConfig = field(default_factory=OpenAIConfig)
    retrieval: RetrievalConfig = field(default_factory=RetrievalConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
