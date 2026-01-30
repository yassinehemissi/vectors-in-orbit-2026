from __future__ import annotations

import argparse

from blocks_to_items.core import BlocksToItems
from .env import load_env
load_env()

def main() -> None:
    parser = argparse.ArgumentParser(description="Run items extraction on blocks/sections.")
    parser.add_argument("--paper-id", required=True, help="paper hash id")
    args = parser.parse_args()

    BlocksToItems().run(args.paper_id)


if __name__ == "__main__":
    main()
