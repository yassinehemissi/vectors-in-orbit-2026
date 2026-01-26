from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class OpenRouterConfig:
    api_key_env: str = "OPENROUTER_API_KEY"
    base_url: str = "https://openrouter.ai/api/v1"
    model: str = "liquid/lfm-2.5-1.2b-instruct:free" #"microsoft/phi-3-medium-128k-instruct"
    timeout_sec: int = 45


@dataclass(frozen=True)
class SummaryConfig:
    max_words: int = 160
    min_words: int = 40
    max_chars_per_section: int = 6000
    max_chars_per_paper: int = 12000
    paper_max_words: int = 220
    paper_min_words: int = 80
    include_types: List[str] = field(default_factory=lambda: ["abstract", "paragraph", "table_body", "figure_caption"])
    system_prompt: str = (
        "You are a scientific text compressor.\n"
        "Your task is to summarize a single document block.\n\n"
        "Rules:\n"
        "- Preserve all scientific terms, variables, and quantities exactly.\n"
        "- Do NOT add interpretation, conclusions, or background.\n"
        "- Do NOT explain or simplify concepts.\n"
        "- Use neutral, factual language only.\n"
        "- Limit the summary to 1–2 sentences.\n"
        "- If the block is already concise, lightly rewrite without expanding.\n"
    )
    paper_system_prompt: str = (
        "You are a scientific summarizer.\n"
        "Summarize the full paper using section summaries only.\n\n"
        "Rules:\n"
        "- Preserve scientific terms, variables, and quantitative results.\n"
        "- Focus on goal, method, setup, datasets, and key results.\n"
        "- Avoid speculation or background.\n"
        "- Keep the summary concise and factual.\n"
    )



@dataclass(frozen=True)
class HBlocksSummarizerConfig:
    openrouter: OpenRouterConfig = field(default_factory=OpenRouterConfig)
    summary: SummaryConfig = field(default_factory=SummaryConfig)
