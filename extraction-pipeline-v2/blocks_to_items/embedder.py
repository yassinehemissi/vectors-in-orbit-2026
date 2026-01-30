from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable, List

from openai import OpenAI

from .config import EmbeddingConfig


@dataclass
class Embedder:
    config: EmbeddingConfig = EmbeddingConfig()

    def embed(self, texts: Iterable[str]) -> List[List[float]]:
        items = list(texts)
        if not items:
            return []

        api_key = os.getenv(self.config.api_key_env)
        if not api_key:
            raise ValueError(f"Missing {self.config.api_key_env}")
        base_url = os.getenv(self.config.base_url_env) or self.config.base_url_default
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=self.config.timeout_sec)

        out: List[List[float]] = []
        for i in range(0, len(items), self.config.batch_size):
            batch = items[i : i + self.config.batch_size]
            resp = client.embeddings.create(model=self.config.model, input=batch)
            data = sorted(resp.data, key=lambda d: d.index)
            out.extend([list(d.embedding) for d in data])
        return out
