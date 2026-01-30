from __future__ import annotations

import json
from typing import Dict, Optional

from storage.astra.client import AstraClientFactory


def store_paper_data(paper_hash: str, payload: Dict[str, object]) -> None:
    cluster = None
    session = None
    try:
        cluster, session = AstraClientFactory().create()
        session.execute(
            "INSERT INTO papers_data (paper_hash, paper_json) VALUES (%s, %s)",
            (paper_hash, json.dumps(payload)),
        )
    finally:
        if session:
            session.shutdown()
        if cluster:
            cluster.shutdown()


def fetch_paper_data(paper_hash: str) -> Optional[Dict[str, object]]:
    cluster = None
    session = None
    try:
        cluster, session = AstraClientFactory().create()
        rs = session.execute("SELECT paper_json FROM papers_data WHERE paper_hash = %s", (paper_hash,))
        row = rs.one()
        if not row or not row.paper_json:
            return None
        return json.loads(row.paper_json)
    finally:
        if session:
            session.shutdown()
        if cluster:
            cluster.shutdown()
