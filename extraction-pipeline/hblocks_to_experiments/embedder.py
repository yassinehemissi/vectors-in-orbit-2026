from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

from fastembed import TextEmbedding

from .config import EmbeddingConfig


@dataclass
class Embedder:
    config: EmbeddingConfig = EmbeddingConfig()

    def embed(self, texts: Iterable[str]) -> List[List[float]]:
        model = TextEmbedding(model_name=self.config.model)
        embeddings = model.embed(list(texts), batch_size=self.config.batch_size)
        return [list(vec) for vec in embeddings]
