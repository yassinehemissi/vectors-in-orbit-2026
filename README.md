# Babyneers — Vectors in Orbit 2026

## Introduction

This repository documents the work of the **Babyneers Team** during the **Vectors in Orbit 2016** hackathon, hosted by **GDC SupCom x FST** and partnered with **Qdrant**. 

We developed **Experimentein.ai**, a platform for extracting, indexing, and discovering protein experiments from scientific literature using vector databases and large language models. Our work demonstrates how vector-based retrieval and semantic search can unlock experiment-level discovery in biology research—transforming fragmented experimental descriptions scattered across papers into a transparent, queryable knowledge space.

## Project Overview

**Experimentein.ai** treats experiments as first-class, structured entities extracted from scientific papers. The system provides:

- **Experiment-level indexing and retrieval** — search for specific experiments rather than documents
- **Similarity-based exploration** — find related experiments via semantic similarity with acknowledged uncertainty
- **Explicit uncertainty tracking** — distinguish measured parameters, inferred parameters, and missing data
- **Traceable provenance** — every extracted claim links back to evidence blocks in the original paper

The platform is a research prototype for transparent discovery and comparison of experimental knowledge, not a predictive or outcome-inference system.

## Architecture Overview

The system separates extraction, storage, retrieval, and user interaction across specialized components:

### Storage Layer

- **Astra DB (Cassandra)** — Canonical storage for complete structured records (papers, sections, blocks, experiments) with full JSON payloads, provenance metadata, and evidence references
- **Qdrant** — Vector search engine storing embeddings paired with minimal payloads (identifiers only) for fast similarity retrieval
- **MongoDB + Mongoose** — User authentication, sessions, and credit accounting in the web application

### Processing Stack

- **GROBID** — PDF to TEI XML conversion, preserving document structure and semantic information
- **lxml + spaCy** — TEI parsing, semantic block extraction, linguistic normalization, and entity recognition
- **FastEmbed + BAAI/bge-base-en-v1.5** — Efficient embedding generation for similarity search
- **LFM-2.5-1.2B-Instruct** (via OpenRouter) — Cost-effective section summarization
- **Llama 3 70B** (via OpenRouter) — Structured experiment extraction with reasoning and confidence scoring
- **Next.js 15 + Server Actions** — Modern web framework with server-side logic for responsive user interface

### Key Design Decisions

We intentionally separate databases to balance auditability, speed, and product flexibility. Full records in Astra ensure reproducibility; minimal embeddings in Qdrant keep retrieval fast; MongoDB isolates product/account logic from scientific storage. OpenRouter provides unified access to multiple LLM providers, allowing users to select their preferred models and avoiding vendor lock-in.

## Repository Structure

**Each Module is documented with README.md**

```
babyneers/
├── extraction-pipeline/          # Data processing pipeline module
│   ├── README.md                # Extraction  
│   └── ...
├── experimentein.ai/            # Web application module
│   ├── README.md                # Web app Static assets
│   └── ...
└── README.md                    # This file
```

### Extraction Pipeline (`extraction-pipeline/`)

Converts PDFs into structured experimental knowledge through deterministic stages:

1. **PDF → TEI XML** (GROBID) — Parse scientific papers preserving structure
2. **TEI → Blocks** (lxml + spaCy) — Extract semantic units with linguistic normalization
3. **Blocks → HBlocks** — Normalize into relational schema with section hierarchy
4. **Summarization** (LFM-2.5 via OpenRouter) — Generate concise section summaries
5. **Embedding** (FastEmbed + BAAI/bge-base) — Create dense vectors for similarity search
6. **Experiment Extraction** (Llama 70B via OpenRouter) — Parse structured experiments with confidence and evidence
7. **Storage** — Persist to Astra DB (full records) and Qdrant (embeddings + IDs)

See `extraction-pipeline/README.md` for setup, usage, and implementation details.

### Web Application (`experimentein.ai/`)

Next.js 15 application providing user-facing features:

- **Search interface** — Query experiments, papers, sections, and blocks
- **Experiment viewer** — Inspect structured experiment records with parameter confidence
- **Comparison view** — Side-by-side comparison of multiple experiments
- **Evidence drawer** — Trace extracted parameters back to source blocks
- **Model selection** — Choose LLM providers and models via OpenRouter
- **Credit system** — Track and manage token-based usage tied to extraction cost

See `experimentein.ai/README.md` for setup, deployment, and feature documentation.

## Technology Stack

**As imposed this uses Qdrant & ADK**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| PDF Processing | GROBID | Convert PDFs to TEI XML |
| XML Parsing | lxml | Parse and extract from TEI |
| NLP | spaCy | Tokenization, normalization, entity recognition |
| Embeddings | FastEmbed + BAAI/bge-base-en-v1.5 | Dense vector generation |
| Canonical Storage | Astra DB (Cassandra) | Full records with provenance |
| Vector Search | Qdrant | Semantic similarity retrieval |
| LLM Provider | OpenRouter | Unified LLM API with model selection |
| Summarization | LFM-2.5-1.2B-Instruct | Cost-effective section summaries |
| Extraction | Llama 3 70B | Structured experiment parsing |
| Web Framework | Next.js 15 + Server Actions | React with server-side logic |
| Database ODM | Mongoose | MongoDB schema validation and management |
| AI Worfklow Logic | ADK | We will use ADK + OpenRouter for agent/agentic workflows

## Getting Started

### Prerequisites

- Python 3.11+ (extraction pipeline) ***IMPORTANT: (Make sure your python version supports cassandra-driver inaries)***
- Node.js 18+ + BUN (web application)
- Docker (recommended for  Qdrant, MongoDB)
  - We're using Atlas & Qdrant Cloud for this though
- Use Astra Token & Security Bundler from astra website and put them in `storage/astra/*` or host a Cassandra instance but you'll have to re-write the `storage/astra/client.py` 
  - We wanted to use Cassandra primarily but we are using the serverless capabilities of Astra but not their high level API just plain CQL
- API keys: OpenRouter (for LLM access)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/babyneers/experimentein.git
   cd experimentein
   ```

2. **Set up the extraction pipeline** (see `extraction-pipeline/README.md`)
   ```bash
   cd extraction-pipeline
   pip install -r requirements.txt
   # Configure environment variables and run through api flask or CLI
   python -m api.py <pdf_path>
   # DEFAULT API PORT IS 4000
   # => TEI/PDF => http://localhost:4000/process 
   ```

3. **Set up the web application** (see `experimentein.ai/README.md`)
   ```bash
   cd experimentein.ai
   npm install
   npm run dev
   ```

4. **Access the application** at `http://localhost:3000`

For detailed setup instructions, Docker Compose configurations, and environment variable templates, refer to the README files in each module.

## Project Timeline

### Completed: 60%

- Specification of experiment-centric problem aligned with research needs
- Full implementation of PDF-to-experiment extraction pipeline (GROBID, lxml, spaCy, LFM-2.5, Llama 70B)
- Integration of Astra DB for canonical storage, Qdrant for semantic search
- FastEmbed with BAAI/bge-base embedding generation
- Next.js 15 web application with Server Actions and Mongoose authentication/credits
- OpenRouter integration allowing user model selection

### Remaining: 40%

**Web Interface Completion**
- Full search flows for papers, sections, blocks, and experiments with confidence filtering
- Experiment viewer with side-by-side parameter comparison
- Evidence drawer with field-level traceability
- Explainability panel showing extraction confidence and alternatives

**Credit and Usage System**
- Complete credit accounting (reserve/execute/finalize/refund cycle) tied to token consumption
- Per-user quota tracking and overage handling
- Cost estimation before extraction based on model selection

**Model Selection and Fine-tuning**
- User-facing model selector for summarization and extraction
- Support for alternative large models (Claude 3.5, GPT-4, other Llama variants)
- Future: domain-specific fine-tuning on curated protein experiment datasets

**Advanced Features**
- Guided exploration with suggested searches based on experiment features
- Batch experiment extraction with progress tracking
- Experiment provenance visualization
- Interactive diff highlighting in comparison view

## Results and Impact

Experimentein.ai demonstrates:

- **Feasibility of experiment-centric discovery** — transforming fragmented experimental descriptions into a queryable knowledge space
- **Effective use of vector databases** — Qdrant enables fast semantic similarity while maintaining scientific rigor through canonical storage in Astra
- **Cost-efficient LLM pipelines** — LFM-2.5 for summarization reduces token consumption; Llama 70B applied only to retrieved evidence
- **Flexible inference infrastructure** — OpenRouter provides unified LLM access without vendor lock-in
- **Transparent extraction with provenance** — every claim is traceable back to source evidence with confidence scores

## Team Members

- **Mohamed Amin Abassi** — Lead  
- **Fatma Ben Lakdhar**  
- **Rima Ardhaoui**  
- **Amina Bayoudh**  
- **Mohamed Yassine Hemissi**

## References

- [Qdrant Vector Database](https://qdrant.tech/)
- [Astra DB Documentation](https://docs.datastax.com/en/astra/latest/)
- [OpenRouter](https://openrouter.ai/)
- [GROBID](https://github.com/kermitt2/grobid)
- [FastEmbed](https://github.com/qdrant/fastembed)
- [Next.js 15](https://nextjs.org/)


## License

© 2026 Babyneers Team. All rights reserved.

---

*AI-assisted documentation*  
**Vectors in Orbit 2026** — GDC SupCom x FST x Qdrant 2026 Babyneers Team. All rights reserved.

