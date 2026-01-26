# experiments-to-storage

Store extracted experiments into Astra and Qdrant.

## What it does

- Inserts experiment records into Astra `experiments` table (normalized columns + full JSON).
- Embeds a compact experiment summary and upserts into Qdrant `experiments` collection.

## Input shape

- Experiments are flat objects with inline evidence per field:
  - `field: { value, evidence, confidence }`
- The full object is stored in Astra as `experiment_json` for traceability.

## Usage

```python
from experiments_to_storage import ExperimentsToStorage

ExperimentsToStorage().store(experiments, paper_id="paper-123")
```

## Requirements

- Astra credentials (see `storage/README.md`)
- Qdrant credentials (see `storage/README.md`)
- Python packages: `fastembed`, `qdrant-client`, `cassandra-driver`
