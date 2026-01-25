"""Additional utilities for the pipeline."""
import json
from pathlib import Path
from typing import List, Dict, Any
from pipeline.experiment_extractor import ExperimentUnit


def save_blocks_json(blocks: List[Any], output_path: Path):
    """Save blocks to JSON file."""
    blocks_data = [block.model_dump() if hasattr(block, 'model_dump') else block for block in blocks]
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(blocks_data, f, indent=2, ensure_ascii=False)


def save_experiments_json(experiments: List[ExperimentUnit], output_path: Path):
    """Save experiments to JSON file."""
    experiments_data = [exp.model_dump() for exp in experiments]
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(experiments_data, f, indent=2, ensure_ascii=False)


def load_experiments_json(input_path: Path) -> List[ExperimentUnit]:
    """Load experiments from JSON file."""
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [ExperimentUnit(**exp) for exp in data]


