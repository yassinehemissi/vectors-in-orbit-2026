from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional

from qdrant_client.models import PointStruct

from storage.astra import AstraClientFactory
from storage.qdrant import QdrantClientFactory

from .config import ExperimentsToStorageConfig
from .embedder import Embedder
from .hashing import text_hash, vector_id


def _field_value(exp: Dict[str, object], key: str):
    val = exp.get(key)
    if isinstance(val, dict):
        return val.get("value")
    return val


def _field_evidence(exp: Dict[str, object], key: str) -> List[str]:
    val = exp.get(key)
    if isinstance(val, dict):
        ev = val.get("evidence") or []
        return [str(x) for x in ev]
    return []


def _compact_text(exp: Dict[str, object]) -> str:
    parts = []
    for key in [
        "title",
        "goal",
        "setup",
        "dataset",
        "metrics",
        "results",
        "baselines",
        "ablations",
    ]:
        val = _field_value(exp, key)
        if isinstance(val, str) and val.strip():
            parts.append(f"{key}: {val.strip()}")
        elif isinstance(val, list):
            parts.append(f"{key}: {'; '.join(map(str, val))}")
    return "\n".join(parts)


@dataclass
class ExperimentsToStorage:
    config: ExperimentsToStorageConfig = ExperimentsToStorageConfig()

    def store(self, experiments: List[Dict[str, object]], paper_id: str) -> None:
        if not paper_id:
            raise ValueError("paper_id is required")
        if not experiments:
            return

        self._store_astra(experiments, paper_id)
        self._store_qdrant(experiments, paper_id)

    def _store_astra(self, experiments: List[Dict[str, object]], paper_id: str) -> None:
        cfg = self.config.storage
        cluster, session = AstraClientFactory().create()
        try:
            for exp in experiments:
                exp_id = exp.get("experiment_id")
                exp_id = str(exp_id) if exp_id else None
                if not exp_id:
                    continue

                evidence_map = {}
                for key in [
                    "title",
                    "goal",
                    "setup",
                    "dataset",
                    "metrics",
                    "results",
                    "baselines",
                    "ablations",
                    "runtime_efficiency",
                    "limitations",
                ]:
                    ev = _field_evidence(exp, key)
                    if ev:
                        evidence_map[key] = ev

                missing = exp.get("missing") or []
                fingerprint = exp.get("fingerprint")

                summary = _compact_text(exp)

                session.execute(
                    f"INSERT INTO {cfg.astra_table} (paper_id, experiment_id, experiment_type, title, goal, setup, dataset, metrics, results, baselines, ablations, runtime_efficiency, limitations, evidence_map, missing, conflicts, confidence_overall, confidence_reasons, fingerprint, summary, summary_hash, experiment_json) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        paper_id,
                        exp_id,
                        exp.get("experiment_type"),
                        _field_value(exp, "title"),
                        _field_value(exp, "goal"),
                        _field_value(exp, "setup"),
                        json.dumps(_field_value(exp, "dataset")) if isinstance(_field_value(exp, "dataset"), (dict, list)) else _field_value(exp, "dataset"),
                        json.dumps(_field_value(exp, "metrics")) if isinstance(_field_value(exp, "metrics"), (dict, list)) else _field_value(exp, "metrics"),
                        json.dumps(_field_value(exp, "results")) if isinstance(_field_value(exp, "results"), (dict, list)) else _field_value(exp, "results"),
                        json.dumps(_field_value(exp, "baselines")) if isinstance(_field_value(exp, "baselines"), (dict, list)) else _field_value(exp, "baselines"),
                        json.dumps(_field_value(exp, "ablations")) if isinstance(_field_value(exp, "ablations"), (dict, list)) else _field_value(exp, "ablations"),
                        json.dumps(_field_value(exp, "runtime_efficiency")) if isinstance(_field_value(exp, "runtime_efficiency"), (dict, list)) else _field_value(exp, "runtime_efficiency"),
                        json.dumps(_field_value(exp, "limitations")) if isinstance(_field_value(exp, "limitations"), (dict, list)) else _field_value(exp, "limitations"),
                        json.dumps(evidence_map),
                        json.dumps(missing),
                        json.dumps(exp.get("conflicts") or []),
                        exp.get("confidence_overall") or 0.0,
                        json.dumps(exp.get("confidence_reasons") or []),
                        fingerprint,
                        summary,
                        text_hash(summary),
                        json.dumps(exp),
                    ),
                )
        finally:
            cluster.shutdown()

    def _store_qdrant(self, experiments: List[Dict[str, object]], paper_id: str) -> None:
        cfg = self.config.storage
        client = QdrantClientFactory().create()
        embedder = Embedder(self.config.embedding)

        texts = []
        payloads = []
        ids = []
        for exp in experiments:
            exp_id = exp.get("experiment_id")
            exp_id = str(exp_id) if exp_id else None
            if not exp_id:
                continue
            summary = _compact_text(exp)
            texts.append(summary)
            payloads.append(
                {
                    "experiment_id": exp_id,
                    "paper_id": paper_id,
                    "summary_hash": text_hash(summary),
                    "experiment_type": exp.get("experiment_type"),
                }
            )
            ids.append(vector_id(paper_id, exp_id))

        if not texts:
            return

        vectors = embedder.embed(texts)
        points = [
            PointStruct(id=pid, vector=v, payload=pl)
            for pid, v, pl in zip(ids, vectors, payloads)
        ]
        client.upsert(collection_name=cfg.qdrant_collection, points=points)

   
