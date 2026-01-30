from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class EmbeddingConfig:
    api_key_env: str = "OPENROUTER_API_KEY"
    base_url_env: str = "OPENROUTER_BASE_URL"
    base_url_default: str = "https://openrouter.ai/api/v1"
    model: str = "baai/bge-m3"
    batch_size: int = 16
    timeout_sec: int = 120


@dataclass(frozen=True)
class OpenRouterConfig:
    api_key_env: str = "OPENROUTER_API_KEY"
    base_url: str = "https://openrouter.ai/api/v1"
    model: str = "liquid/lfm-2.5-1.2b-instruct:free"
    timeout_sec: int = 60


@dataclass(frozen=True)
class StorageConfig:
    astra_blocks: str = "blocks"
    astra_sections: str = "sections"
    astra_papers: str = "papers"
    qdrant_blocks: str = "blocks"
    qdrant_sections: str = "sections"
    qdrant_papers: str = "papers"
    qdrant_block_chunking: bool = False
    qdrant_block_max_chars: int = 1200
    qdrant_block_overlap_sentences: int = 1
    qdrant_upsert_batch_size: int = 64


@dataclass(frozen=True)
class SummaryConfig:
    min_words: int = 20
    max_words: int = 60
    paper_min_words: int = 40
    paper_max_words: int = 120
    max_chars_per_section: int = 8000
    max_chars_per_paper: int = 12000
    include_types: tuple[str, ...] = ("paragraph", "table_body", "figure_caption", "figure")
    system_prompt: str = (
        "You summarize scientific sections. Be concise, factual, and keep methods and results. "
        "No speculation."
    )
    paper_system_prompt: str = (
        "You summarize whole scientific papers using section summaries. Be concise and factual."
    )


@dataclass(frozen=True)
class StructureToBlocksConfig:
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    openrouter: OpenRouterConfig = field(default_factory=OpenRouterConfig)
    storage: StorageConfig = field(default_factory=StorageConfig)
    summary: SummaryConfig = field(default_factory=SummaryConfig)
