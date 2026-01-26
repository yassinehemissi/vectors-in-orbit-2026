from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

from pdf_to_tei import PDFToTEI
from tei_to_blocks import tei_to_blocks_json
from blocks_to_hblocks import blocks_to_hblocks
from hblocks_summarizer import summarize_hblocks
from hblocks_to_storage import HBlocksToStorage
from hblocks_to_experiments import HBlocksToExperiments
from experiments_to_storage import ExperimentsToStorage


def process_tei(tei_xml: str) -> Dict[str, object]:
    blocks = tei_to_blocks_json(tei_xml=tei_xml)
    hblocks = blocks_to_hblocks(blocks=blocks)
    summarized = summarize_hblocks(hblocks)
    HBlocksToStorage().store(summarized)
    return summarized


def process_pdf(pdf_path: Path) -> Dict[str, object]:
    tei_xml = PDFToTEI().convert(pdf_path)
    return process_tei(tei_xml)


def run_experiments(paper_id: str) -> Dict[str, object]:
    pipeline = HBlocksToExperiments()
    results = pipeline.run(paper_id=paper_id)
    experiments = results.get("experiments", [])
    if experiments:
        ExperimentsToStorage().store(experiments, paper_id=paper_id)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Run full pipeline for PDF or TEI")
    parser.add_argument("--pdf", help="Path to PDF file")
    parser.add_argument("--tei", help="Path to TEI XML file")
    parser.add_argument("--run-experiments", action="store_true", help="Run experiment extraction pipeline")
    parser.add_argument("--out", help="Optional JSON output path")
    args = parser.parse_args()

    if not args.pdf and not args.tei:
        raise SystemExit("Provide --pdf or --tei")

    if args.pdf and args.tei:
        raise SystemExit("Use only one of --pdf or --tei")

    if args.pdf:
        summarized = process_pdf(Path(args.pdf))
    else:
        tei_xml = Path(args.tei).read_text(encoding="utf-8")
        summarized = process_tei(tei_xml)

    paper_id = None
    meta = summarized.get("meta") if isinstance(summarized, dict) else None
    if isinstance(meta, dict):
        paper_id = meta.get("paper_id")

    results = {"hblocks": summarized}
    if args.run_experiments and paper_id:
        results["experiments"] = run_experiments(str(paper_id))

    if args.out:
        Path(args.out).write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
