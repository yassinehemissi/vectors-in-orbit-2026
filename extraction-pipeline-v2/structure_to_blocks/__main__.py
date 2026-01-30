from __future__ import annotations

import argparse
import json

from .core import StructureToBlocks
from .env import load_env
load_env()

def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize structure.json into blocks/sections and store.")
    parser.add_argument("--hash", required=True, help="paper hash key")
    parser.add_argument("--no-astra", action="store_true", help="Skip Astra storage")
    parser.add_argument("--no-qdrant", action="store_true", help="Skip Qdrant storage")
    parser.add_argument("--out", help="Optional path to write normalized JSON")
    args = parser.parse_args()

    out = StructureToBlocks().run(
        args.hash,
        store_astra=not args.no_astra,
        store_qdrant=not args.no_qdrant,
    )
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
