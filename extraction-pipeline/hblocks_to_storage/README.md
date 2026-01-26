# hblocks-to-storage

Persist summarized hblocks into Astra (CQL) and Qdrant.

## What it does

- Inserts full blocks into Astra `hblocks_blocks` and `hblocks_by_section`.
- Inserts section summaries into Astra `hblocks_sections`.
- Inserts paper summary into Astra `hblocks_papers`.
- Embeds and upserts vectors into Qdrant for blocks, sections, and papers.

## Embeddings

Uses `fastembed` with `BAAI/bge-base-en-v1.5` (768‑dim). Configure batch size in `config.py`.

## Usage

```python
from hblocks_to_storage import HBlocksToStorage

HBlocksToStorage().store(hblocks)
```

## Requirements

- Astra credentials (see `storage/README.md`)
- Qdrant credentials (see `storage/README.md`)
- Python packages: `fastembed`, `qdrant-client`, `cassandra-driver`
