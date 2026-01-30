from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Iterable
from .env import load_env
load_env()

from qdrant_client.models import (
    Distance,
    VectorParams,
    HnswConfigDiff,
    OptimizersConfigDiff,
    WalConfigDiff,
    PayloadSchemaType,
)

from storage.astra.client import AstraClientFactory
from storage.qdrant.client import QdrantClientFactory


def _load_manifest(schema_dir: Path) -> Iterable[Path]:
    manifest_path = schema_dir / "manifest.json"
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    for name in data.get("tables", []):
        yield schema_dir / name


def init_astra() -> None:
    schema_dir = Path(__file__).parent / "schemas" / "astra"
    cluster, session = AstraClientFactory().create()
    try:
        print("[init_db] initializing Astra schemas")
        for path in _load_manifest(schema_dir):
            cql = path.read_text(encoding="utf-8").strip()
            if cql:
                print(f"[init_db] apply {path.name}")
                session.execute(cql)
    finally:
        cluster.shutdown()


def _payload_schema_type(name: str) -> PayloadSchemaType:
    mapping = {
        "keyword": PayloadSchemaType.KEYWORD,
        "integer": PayloadSchemaType.INTEGER,
        "float": PayloadSchemaType.FLOAT,
        "bool": PayloadSchemaType.BOOL,
        "text": PayloadSchemaType.TEXT,
        "geo": PayloadSchemaType.GEO,
    }
    return mapping.get(name, PayloadSchemaType.KEYWORD)


def _ensure_collection(client, cfg: dict, size_override: int | None = None) -> None:
    name = cfg.get("collection")
    if not name:
        return
    try:
        client.get_collection(name)
    except Exception:
        dist_name = str(cfg.get("distance", "COSINE")).upper()
        dist = Distance.COSINE
        if dist_name == "DOT":
            dist = Distance.DOT
        elif dist_name == "EUCLID":
            dist = Distance.EUCLID

        size = size_override or int(cfg.get("vector_size", 1024))
        hnsw_cfg = cfg.get("hnsw") or {}
        optim_cfg = cfg.get("optimizers") or {}
        wal_cfg = cfg.get("wal") or {}
        on_disk_payload = bool(cfg.get("on_disk_payload", False))

        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=size, distance=dist),
            hnsw_config=HnswConfigDiff(**hnsw_cfg) if hnsw_cfg else None,
            optimizers_config=OptimizersConfigDiff(**optim_cfg) if optim_cfg else None,
            wal_config=WalConfigDiff(**wal_cfg) if wal_cfg else None,
            on_disk_payload=on_disk_payload,
        )

    indexes = cfg.get("payload_indexes") or []
    for idx in indexes:
        field = idx.get("field_name")
        schema = idx.get("field_schema")
        if not field or not schema:
            continue
        try:
            client.create_payload_index(
                collection_name=name,
                field_name=field,
                field_schema=_payload_schema_type(str(schema)),
            )
        except Exception:
            continue


def init_qdrant() -> None:
    schema_dir = Path(__file__).parent / "schemas" / "qdrant"
    manifest_path = schema_dir / "manifest.json"
    data = json.loads(manifest_path.read_text(encoding="utf-8"))

    client = QdrantClientFactory().create()
    print("[init_db] initializing Qdrant collections")
    for name in data.get("collections", []):
        cfg = json.loads((schema_dir / name).read_text(encoding="utf-8"))
        size = int(os.getenv("QDRANT_VECTOR_SIZE", cfg.get("vector_size", 1024)))
        print(f"[init_db] ensure {cfg.get('collection')} size={size}")
        _ensure_collection(client, cfg, size_override=size if size > 0 else None)


def main() -> None:
    print("[init_db] start")
    init_astra()
    init_qdrant()
    print("[init_db] done")


if __name__ == "__main__":
    main()
