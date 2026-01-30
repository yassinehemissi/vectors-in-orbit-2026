# structure_to_blocks

Transforms stored paper structure into normalized sections and blocks, then persists them for retrieval.

## What it does
- Loads `paper_json` from Astra `papers_data`.
- Builds sections and blocks with stable UUIDs.
- Normalizes block types: `text`, `table`, `figure`.
- Summarizes sections for later retrieval.
- Stores data into Astra tables (`papers`, `sections`, `blocks`).
- Embeds and upserts vectors into Qdrant (`papers`, `sections`, `blocks`).

## Inputs
- `paper_hash` (used to fetch UploadThing URLs and metadata)

## Outputs
- Astra records for papers/sections/blocks
- Qdrant vectors for papers/sections/blocks

© BABYNEERS
*This is a generated AI README under instructions.*
