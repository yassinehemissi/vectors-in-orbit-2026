from __future__ import annotations

import argparse

from .pipeline import main as pipeline_main


def main() -> None:
    parser = argparse.ArgumentParser(description="Extraction pipeline CLI")
    parser.add_argument("--pdf", help="Path to PDF file")
    parser.add_argument("--tei", help="Path to TEI XML file")
    parser.add_argument("--run-experiments", action="store_true", help="Run experiment extraction pipeline")
    parser.add_argument("--out", help="Optional JSON output path")
    args = parser.parse_args()

    pipeline_main()


if __name__ == "__main__":
    main()
