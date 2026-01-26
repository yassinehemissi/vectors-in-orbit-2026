# hblocks-to-experiments

Pipeline to discover, retrieve, and extract experiments from stored hblocks (Astra + Qdrant) using Llama‑3 70B via OpenAI SDK.

## Stages implemented

- **Stage A:** candidate discovery from section summaries (Astra)
- **Stage A2:** augmentation prompt builder (paper‑specific hints)
- **Stage B:** evidence retrieval (Astra + optional Qdrant)
- **Stage C:** single LLM call per experiment producing extraction + inline XAI
- **Stage E:** dedup (hash‑based, drops duplicates)

## Output shape

- Returns a single `experiments[]` array of flat objects.
- Each field is `{ value, evidence, confidence }`.
- `title` is always inferred if missing; other fields become `missing` if not supported.

## Usage

```python
from hblocks_to_experiments import HBlocksToExperiments

pipeline = HBlocksToExperiments()
result = pipeline.run(paper_id="paper-123")
```

## Environment

- `ESPRIT_API_KEY`
- `ESPRIT_BASE_URL` (optional for OpenAI‑compatible providers)

## Notes

- This module assumes Astra tables + Qdrant collections are initialized.
- Qdrant vector search is optional (default true, toggle in config).
- Debug JSONL files are written if `HBLOCKS_DEBUG_DIR` is set.
