# blocks-to-hblocks

Normalize `tei-to-blocks` output into a relational JSON schema that preserves section structure, block ordering, and references while removing noise. This module is designed to be fast, deterministic, and storage-friendly.

## What it does

- Normalizes whitespace and filters noisy blocks.
- Assigns stable `section_id` values from `section_path`.
- Adds `block_index` (global) and `section_index` (within section).
- Preserves `block_id`, `source`, and `chunk` metadata.
- Optionally emits relational links (`next_block`, `same_section`).

## Output shape

```json
{
  "sections": [
    {
      "section_id": "s_...",
      "path": ["Methods", "Protein Purification"],
      "title": "Protein Purification",
      "parent_id": "s_...",
      "level": 2
    }
  ],
  "blocks": [
    {
      "block_id": "b_...",
      "type": "paragraph",
      "text": "...",
      "section_id": "s_...",
      "section_path": ["Methods", "Protein Purification"],
      "source": {"tei_xpath": "..."},
      "chunk": {"index": 1, "total": 3},
      "block_index": 12,
      "section_index": 4,
      "flags": {
        "is_noise": false,
        "is_experiment_candidate": true
      }
    }
  ],
  "links": [
    {"from": "b_1", "to": "b_2", "type": "next_block"}
  ],
  "meta": {
    "paper_id": "...",
    "input_blocks": 220,
    "output_blocks": 190,
    "dropped_noise": 30
  }
}
```

## Usage

```python
from blocks_to_hblocks import blocks_to_hblocks

hblocks = blocks_to_hblocks(
    blocks=blocks_from_tei,
    paper_id="paper-123",
    emit_links=False,
)
```

For configuration:

```python
from blocks_to_hblocks import BlocksToHBlocks, HBlocksConfig

cfg = HBlocksConfig()
converter = BlocksToHBlocks(config=cfg)
hblocks = converter.normalize(blocks_from_tei)
```

## Noise handling

- Removes empty, punctuation-only, numeric-only, and short blocks by default.
- Short block types such as `title`, `section_title`, and `figure_caption` are preserved.
- You can disable dropping and only mark blocks via `NoiseConfig.drop_noise`.

## Experiment candidate flags

- `is_experiment_candidate` is a lightweight keyword-based flag used by downstream retrieval.
- You can tune keywords and hit thresholds via `CandidateConfig`.

## Notes

- This module is pure and fast; it performs no I/O or network calls.
- Designed to keep IDs stable and references intact for later summarization and experiment extraction.
