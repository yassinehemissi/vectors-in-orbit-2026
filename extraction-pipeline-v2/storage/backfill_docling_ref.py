from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path
from typing import Dict, List

from storage.astra.client import AstraClientFactory
from storage.env import load_env

load_env()


def _stable_uuid(paper_id: str, seed: str) -> str:
    raw = f"{paper_id}::{seed}"
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, raw))


def backfill_docling_refs(paper_id: str, structure_path: Path) -> None:
    structure = json.loads(structure_path.read_text(encoding="utf-8"))
    sections = structure.get("sections") if isinstance(structure, dict) else None
    if not isinstance(sections, list):
        raise ValueError("structure.json missing sections list")

    cluster, session = AstraClientFactory().create()
    try:
        sec_updates = 0
        blk_updates = 0
        for s_idx, sec in enumerate(sections, start=1):
            if not isinstance(sec, dict):
                continue
            title = sec.get("title") or sec.get("section_title") or ""
            section_docling_id = sec.get("section_id")
            section_uuid = _stable_uuid(paper_id, f"section::{s_idx}::{title}")
            if section_docling_id:
                session.execute(
                    "UPDATE sections SET docling_ref = %s WHERE paper_id = %s AND section_id = %s",
                    (str(section_docling_id), paper_id, section_uuid),
                )
                sec_updates += 1

            blocks = sec.get("blocks") or []
            block_index = 0
            for b in blocks:
                if not isinstance(b, dict):
                    continue
                block_index += 1
                block_docling_id = b.get("block_id")
                block_uuid = _stable_uuid(paper_id, f"{section_uuid}::block::{block_index}")
                if block_docling_id:
                    session.execute(
                        "UPDATE blocks SET docling_ref = %s WHERE paper_id = %s AND block_id = %s",
                        (str(block_docling_id), paper_id, block_uuid),
                    )
                    blk_updates += 1

        print(f"[backfill_docling_ref] sections_updated={sec_updates} blocks_updated={blk_updates}")
    finally:
        cluster.shutdown()


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill docling_ref into sections/blocks from structure.json")
    parser.add_argument("--paper-hash", required=True, help="paper hash (paper_id)")
    parser.add_argument("--structure", required=True, help="path to structure.json")
    args = parser.parse_args()

    backfill_docling_refs(args.paper_hash, Path(args.structure))


if __name__ == "__main__":
    main()
