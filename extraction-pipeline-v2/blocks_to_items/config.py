from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class OpenAIConfig:
    api_key_env: str = "OPENAI_API_KEY"
    base_url_env: str = "OPENAI_BASE_URL"
    base_url_default: str = "https://api.openai.com/v1"
    model_candidates: str = "hosted_vllm/Llama-3.1-70B-Instruct"
    model_extract: str = "hosted_vllm/Llama-3.1-70B-Instruct"
    timeout_sec: int = None


@dataclass(frozen=True)
class EmbeddingConfig:
    api_key_env: str = "OPENROUTER_API_KEY"
    base_url_env: str = "OPENROUTER_BASE_URL"
    base_url_default: str = "https://openrouter.ai/api/v1"
    model: str = "baai/bge-m3"
    batch_size: int = 16
    timeout_sec: int = None


@dataclass(frozen=True)
class RetrievalConfig:
    top_k: int = 12


@dataclass(frozen=True)
class StorageConfig:
    astra_items: str = "items"
    astra_blocks: str = "blocks"
    astra_sections: str = "sections"
    qdrant_blocks: str = "blocks"
    qdrant_items: str = "items"


@dataclass(frozen=True)
class BlocksToItemsConfig:
    openai: OpenAIConfig = field(default_factory=OpenAIConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    retrieval: RetrievalConfig = field(default_factory=RetrievalConfig)
    storage: StorageConfig = field(default_factory=StorageConfig)
