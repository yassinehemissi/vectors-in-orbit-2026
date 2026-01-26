# hblocks-summarizer

Summarize normalized hblocks by section using OpenRouter (Liquid Foundation model `lfm-2.5-1.2b-instruct` by default) and attach summaries to the schema.

## What it does

- Groups block text by `section_id`.
- Calls OpenRouter to generate per-section summaries.
- Writes summaries into the hblocks schema under:
  - `sections[].summary`
  - `summaries[]` (summary table)

## Usage

```python
from hblocks_summarizer import summarize_hblocks

summarized = summarize_hblocks(hblocks)
```

## Configuration

```python
from hblocks_summarizer import HBlocksSummarizer, HBlocksSummarizerConfig

cfg = HBlocksSummarizerConfig()
engine = HBlocksSummarizer(config=cfg)

summarized = engine.summarize(hblocks)
```

## Environment

Set your OpenRouter API key in:

- `OPENROUTER_API_KEY`

You can override model and base URL in `config.py`.

## Notes

- The summarizer is network-bound and adds latency per section.
- Use `summary.max_chars_per_section` to control token usage.
- Summaries are designed to be embedded in Qdrant while full text stays in Cassandra.
