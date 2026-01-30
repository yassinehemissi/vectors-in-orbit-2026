# blocks_to_items

Candidate-driven item extraction from blocks using retrieval-first signals.

## What it does (v2.3)
- Uses Qdrant similarity queries with protein-bio cues to find candidate blocks.
- Groups hits by section and sends a small context to the LLM to produce candidates.
- Merges candidates deterministically (no LLM merge).
- Converts candidates directly into lightweight items and stores them.

## Inputs
- `paper_id` (hash)
- Astra `sections` table (for section metadata)
- Qdrant `blocks` collection (for retrieval)

## Outputs
- Astra `items` records
- Qdrant `items` vectors (label + summary)

## Notes
- No Stage C extraction or Stage F normalization in v2.3.
- Items are essentially enriched candidates.

© BABYNEERS
*This is a generated AI README under instructions.*
