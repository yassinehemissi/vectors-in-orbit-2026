from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ChunkingConfig:
    max_chars: int = 1200
    max_sentences: int = 10


@dataclass(frozen=True)
class TableDetectionConfig:
    min_text_len: int = 80
    min_rows: int = 2
    min_multi_space_rows: int = 2
    min_numeric_hits: int = 12
    min_total_numeric: int = 18
    min_df_rows: int = 2
    min_df_cols: int = 3


@dataclass(frozen=True)
class FigureDetectionConfig:
    max_caption_chars: int = 400
    max_caption_words: int = 80
    allow_inline_reference: bool = True


@dataclass(frozen=True)
class ConverterConfig:
    include_front: bool = True
    include_back: bool = False
    chunking: ChunkingConfig = field(default_factory=ChunkingConfig)
    tables: TableDetectionConfig = field(default_factory=TableDetectionConfig)
    figures: FigureDetectionConfig = field(default_factory=FigureDetectionConfig)
