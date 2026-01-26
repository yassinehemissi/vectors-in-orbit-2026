# extraction-pipeline

This folder contains the full document → experiments pipeline, split into modular stages.

## Modules

- `tei_to_blocks/`
  - Converts TEI XML into normalized blocks with stable IDs and section paths.

- `blocks_to_hblocks/`
  - Cleans/noise-filters blocks and produces relational hblocks (sections + blocks + links).

- `hblocks_summarizer/`
  - Generates section summaries and a paper summary using Liquid Foundation Model on OpenRouter.

- `hblocks_to_storage/`
  - Stores hblocks into Astra (CQL) and Qdrant, and embeds blocks/sections/papers.

- `hblocks_to_experiments/`
  - Multi-stage experiment extraction pipeline (discovery → evidence → extraction → XAI → dedup).

- `storage/`
  - Initialization-only wrappers + schema files for Astra and Qdrant.

## Notes

- Storage uses Astra DB (CQL) and Qdrant with separate collections for blocks/sections/papers.
- Embeddings use `BAAI/bge-base-en-v1.5` (768-dim).
- LLM calls are OpenAI-SDK compatible with custom base URLs (e.g., OpenRouter/Groq).
