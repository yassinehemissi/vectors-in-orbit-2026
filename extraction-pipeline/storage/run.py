from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Iterable, List

from qdrant_client.models import Distance, HnswConfigDiff, VectorParams

from astra import AstraClientFactory
from qdrant import QdrantClientFactory

ROOT = Path(__file__).resolve().parent
SCHEMAS = ROOT / "schemas"
ASTRA_SCHEMAS = SCHEMAS / "astra"
QDRANT_SCHEMAS = SCHEMAS / "qdrant"


def read_cql(path: Path) -> List[str]:
    raw = path.read_text(encoding="utf-8-sig")
    parts = [p.strip() for p in raw.split(";") if p.strip()]
    return [p + ";" for p in parts if p]


def init_astra() -> None:
    cluster, session = AstraClientFactory().create()
    try:
        cql_files = [
            ASTRA_SCHEMAS / "astra_hblocks_blocks.cql",
            ASTRA_SCHEMAS / "astra_hblocks_sections.cql",
            ASTRA_SCHEMAS / "astra_hblocks_papers.cql",
            ASTRA_SCHEMAS / "astra_hblocks_by_section.cql",
        ]
        for cql in cql_files:
            for stmt in read_cql(cql):
                session.execute(stmt)
        print("Astra schema initialized")
    finally:
        cluster.shutdown()


def _load_qdrant_schema(name: str) -> dict:
    path = QDRANT_SCHEMAS / f"qdrant_{name}.json"
    return json.loads(path.read_text(encoding="utf-8-sig"))


def init_qdrant() -> None:
    client = QdrantClientFactory().create()
    existing = {c.name for c in client.get_collections().collections}

    vector_size = int(os.getenv("QDRANT_VECTOR_SIZE", "768"))

    for name in ["hblocks_blocks", "hblocks_sections", "hblocks_papers"]:
        if name not in existing:
            schema = _load_qdrant_schema(name)
            hnsw = schema.get("hnsw", {})
            client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
                hnsw_config=HnswConfigDiff(
                    m=int(hnsw.get("m", 16)),
                    ef_construct=int(hnsw.get("ef_construct", 128)),
                ),
            )
            print(f"Created Qdrant collection: {name}")

        # Ensure payload indexes for filters
        client.create_payload_index(
            collection_name=name,
            field_name="paper_id",
            field_schema="keyword",
        )
        if name in {"hblocks_blocks", "hblocks_sections"}:
            client.create_payload_index(
                collection_name=name,
                field_name="section_id",
                field_schema="keyword",
            )
        if name == "hblocks_blocks":
            client.create_payload_index(
                collection_name=name,
                field_name="block_id",
                field_schema="keyword",
            )


def main() -> None:
    init_qdrant()
    init_astra()


if __name__ == "__main__":
    main()
