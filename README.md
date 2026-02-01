# Babyneers � Vectors in Orbit 2026

## Introduction

This repository documents the work of the **Babyneers Team** during the **Vectors in Orbit 2026** hackathon (GDC SupCom x FST, with Qdrant partnership).

We built **Experimentein.ai**, a platform for extracting, indexing, and discovering protein experiments from scientific literature using vector search and LLM-powered parsing. The system treats experiments as first-class entities and keeps provenance links to the evidence in the source paper.

## What This Repo Contains

- A v2 extraction pipeline that turns PDFs into structured blocks and experiment items
- A Next.js 16 web app for search, exploration, and evidence viewing
- A lightweight scrapper service that uploads assets to UploadThing
- An MCP server that exposes Qdrant + Astra tools to the app agent
- A Docker-based GROBID instance for TEI extraction

## Architecture Overview

### Storage

- **Astra DB (Cassandra)** � Canonical storage for papers, sections, blocks, items, and metadata
- **Qdrant** � Vector search for blocks/sections/papers/items
- **MongoDB** � User auth, sessions, credits, and app state
- **UploadThing** � File storage for PDFs, figures, tables, and JSON assets

### Processing

- **GROBID** � PDF to TEI XML
- **Docling** � PDF structure extraction (used in v2)
- **lxml + spaCy** � Structural parsing and normalization
- **OpenRouter embeddings** � Vector creation (bge-m3)
- **OpenAI-compatible LLMs** � Candidate extraction/merging in v2
- **LangGraph** � In-app agent orchestration

## Repository Structure

```
vectors-in-orbit-2026/
+-- extraction-pipeline-v2/     # v2 pipeline modules
+-- experimentein.ai/           # Next.js web app
+-- scrapper-service/           # UploadThing file uploader
+-- mcp_server_qdrant_astra/     # MCP server (Qdrant + Astra + OpenRouter embeddings)
+-- grobid-instance/            # Docker-based GROBID space
+-- README.md                   # This file
```

## Pipeline v2 (Extraction)

Pipeline stages run as separate modules:

1. **pdf_to_infra** � Ingest PDF, call Docling/GROBID, extract assets, upload to UploadThing, store `papers_data` in Astra
2. **structure_to_blocks** � Normalize sections/blocks, summarize sections, embed to Qdrant, store in Astra
3. **blocks_to_items** � Retrieval-first candidate generation, deterministic merge, store items and vectors

See `extraction-pipeline-v2/README.md` for setup and module docs.

## Web Application

`experimentein.ai/` is a Next.js 16 app with:

- Evidence-first search across papers/sections/blocks/items
- Experiment viewer and comparison tools
- Credit accounting and usage history
- LangGraph agent with optional MCP-backed search tools

See `experimentein.ai/README.md` for app setup.

## Quick Start (Local)

1. Start dependencies (Qdrant, MongoDB, Astra, UploadThing, OpenRouter API key).
2. Run GROBID and Docling services.
3. Run the pipeline modules from `extraction-pipeline-v2/`.
4. Run the web app from `experimentein.ai/`.

Each module has its own README with exact commands and env vars.

### Quickstart Links

1. `extraction-pipeline-v2/README.md`
2. `extraction-pipeline-v2/pdf_to_infra/README.md`
3. `extraction-pipeline-v2/structure_to_blocks/README.md`
4. `extraction-pipeline-v2/blocks_to_items/README.md`
5. `extraction-pipeline-v2/storage/README.md`
6. `scrapper-service/README.md`
7. `mcp_server_qdrant_astra/README.md`
8. `grobid-instance/README.md`
9. `experimentein.ai/README.md`
10. `experimentein.ai/ai/README.md`

## Team

- Mohamed Amin Abassi (Lead)
- Fatma Ben Lakdhar
- Rima Ardhaoui
- Amina Bayoudh
- Mohamed Yassine Hemissi

## License

� 2026 Babyneers Team. All rights reserved.
