# hblocks-to-experiments

Pipeline to discover, retrieve, and extract experiments from stored hblocks (Astra + Qdrant) using Llama‑3 70B via OpenAI SDK.

## Stages implemented

- **Stage A:** candidate discovery from section summaries (Astra)
- **Stage B:** evidence retrieval (Astra + optional Qdrant)
- **Stage C:** structured extraction (LLM)
- **Stage D:** XAI / conflict check (LLM)
- **Stage E:** dedup (hash‑based, lightweight)

## Usage

```python
from hblocks_to_experiments import HBlocksToExperiments

pipeline = HBlocksToExperiments()
result = pipeline.run(paper_id="paper-123")
```

## Environment

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional for OpenAI‑compatible providers)

## Notes

- This module assumes Astra tables + Qdrant collections are initialized.
- Qdrant vector search is optional (toggle in config).
- Dedup is a lightweight hash pass; you can add LLM judge for borderline cases.
