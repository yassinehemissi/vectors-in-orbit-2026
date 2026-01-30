from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, List

from qdrant_client.models import PointStruct

from storage.astra.client import AstraClientFactory
from storage.qdrant.client import QdrantClientFactory

from .config import BlocksToItemsConfig
from .embedder import Embedder


@dataclass
class ItemsStorage:
    config: BlocksToItemsConfig = BlocksToItemsConfig()

    def store(self, paper_id: str, items: List[Dict[str, object]]) -> None:
        self._store_astra(paper_id, items)
        self._store_qdrant(paper_id, items)

    def _store_astra(self, paper_id: str, items: List[Dict[str, object]]) -> None:
        cfg = self.config.storage
        cluster, session = AstraClientFactory().create()
        try:
            for it in items:
                item_id = str(it.get("item_id"))
                item_kind = it.get("item_kind")
                label = (it.get("label") or {}).get("value") if isinstance(it.get("label"), dict) else it.get("label")
                summary = (it.get("summary") or {}).get("value") if isinstance(it.get("summary"), dict) else it.get("summary")
                confidence = it.get("confidence_overall")
                session.execute(
                    f"INSERT INTO {cfg.astra_items} (paper_id, item_id, item_kind, label, summary, confidence_overall, item_json) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        item_id,
                        item_kind,
                        label,
                        summary,
                        confidence,
                        json.dumps(it),
                    ),
                )
        finally:
            cluster.shutdown()

    def _store_qdrant(self, paper_id: str, items: List[Dict[str, object]]) -> None:
        cfg = self.config.storage
        client = QdrantClientFactory().create()
        embedder = Embedder(self.config.embedding)

        texts = []
        rows = []
        for it in items:
            label = (it.get("label") or {}).get("value") if isinstance(it.get("label"), dict) else it.get("label")
            summary = (it.get("summary") or {}).get("value") if isinstance(it.get("summary"), dict) else it.get("summary")
            text = " ".join([str(label or ""), str(summary or "")]).strip()
            if not text:
                continue
            texts.append(text)
            rows.append((it, text))

        vectors = embedder.embed(texts) if texts else []
        points = []
        for (it, text), v in zip(rows, vectors):
            item_id = str(it.get("item_id"))
            payload = {
                "paper_id": paper_id,
                "item_id": item_id,
                "item_kind": it.get("item_kind"),
            }
            points.append(PointStruct(id=item_id, vector=v, payload=payload))

        if points:
            client.upsert(collection_name=cfg.qdrant_items, points=points)
