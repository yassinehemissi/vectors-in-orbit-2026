# blocks_to_items

Candidate-driven item extraction from blocks using retrieval-first signals.

## What it does (v2.3)

- Uses Qdrant similarity queries with protein-bio cues to find candidate blocks.
- Groups hits by section and sends a small context to the LLM to produce candidates.
- Merges candidates deterministically (no LLM merge).
- Converts candidates into lightweight items and stores them.

## Inputs

- `paper_id` (hash)
- Astra `sections` table (for section metadata)
- Qdrant `blocks` collection (for retrieval)

## Outputs

- Astra `items` records
- Qdrant `items` vectors (label + summary)

## Environment Variables

- `OPENAI_API_KEY` (OpenAI-compatible LLM; defaults to OpenAI base URL)
- `OPENAI_BASE_URL` (optional)
- `OPENROUTER_API_KEY` (embeddings)
- `OPENROUTER_BASE_URL` (optional)
- `QDRANT_URL`, `QDRANT_API_KEY`
- Astra Cassandra credentials (see `storage/README.md`)

## Run

```bash
python -m blocks_to_items --paper-id <paper_hash>
```

© BABYNEERS
