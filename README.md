# Scientific Paper Processing Pipeline

A comprehensive system for extracting structured experiment data from scientific PDF papers.

## Architecture

### 1️⃣ PDF → TEI XML (Document Normalization)
- **GROBID** converts raw PDFs into TEI XML
- Preserves: Sections, Headings, References, Figures, Tables
- **TEI Parser** converts TEI XML into structured Blocks JSON
- Standardizes messy scientific papers for downstream automation

### 2️⃣ Block Structuring Layer
- Transforms noisy academic text into clean semantic units
- Fixes headings & noise, removes artifacts, normalizes section titles
- Creates atomic blocks (one logical unit per block)
- Output: Section Packets ready for summarization and experiment extraction

### 3️⃣ Summarization Layer
- Uses small models for cost-efficient section summarization
- Compresses long scientific sections while preserving experimental context
- Reduces token size before embeddings

### 4️⃣ Experiment Extraction Layer (Core Intelligence)
- Uses large model (14B) to extract structured experiment objects:
  - Protein name
  - Method
  - Conditions
  - Inputs/outputs
  - Measurements
  - Observations
- Output: Structured Experiments JSON

### 5️⃣ Vectorization & Storage
- **Qdrant Vector DB**: Semantic similarity, experiment comparison, retrieval
- **ScyllaDB**: Persistent structured storage, fast lookup, metadata tracking

## Setup

### Quick Start (Windows PowerShell)

For Windows users, use the automated setup script:

```powershell
.\setup.ps1
```

This will:
- Check Python installation
- Install Python dependencies
- Start Docker containers (GROBID, Qdrant, ScyllaDB)
- Create `.env` configuration file
- Verify all services

### Manual Setup

#### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** For GPU support with large models, you may also need:
```bash
pip install bitsandbytes  # For 8-bit quantization
```

### 2. Set Up GROBID

GROBID is required for PDF to TEI XML conversion. You can run it using Docker:

```bash
# Start GROBID service
docker run -d -p 8070:8070 lfoppiano/grobid:0.8.1

# Verify it's running
curl http://localhost:8070/api/isalive
```

Alternatively, install GROBID locally following the [official instructions](https://grobid.readthedocs.io/en/latest/Install-Grobid/).

### 3. Set Up Qdrant Vector Database

```bash
# Using Docker
docker run -d -p 6333:6333 qdrant/qdrant

# Or install locally
# See: https://qdrant.tech/documentation/quick-start/
```

### 4. Set Up ScyllaDB

```bash
# Using Docker
docker run -d -p 9042:9042 scylladb/scylla

# Or install locally
# See: https://docs.scylladb.com/getting-started/
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# GROBID Configuration
GROBID_URL=http://localhost:8070
GROBID_TIMEOUT=120

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=experiments
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# ScyllaDB Configuration
SCYLLADB_HOSTS=127.0.0.1
SCYLLADB_KEYSPACE=scientific_papers
SCYLLADB_PORT=9042

# Model Configuration
SUMMARIZATION_MODEL=facebook/bart-large-cnn
EXTRACTION_MODEL=mistralai/Mistral-7B-Instruct-v0.2
DEVICE=cpu  # Use 'cuda' if GPU available
CUDA_AVAILABLE=false

# API-based Summarization (Optional - use API instead of local model)
USE_API_SUMMARIZATION=false  # Set to 'true' to use API
SUMMARIZATION_API_PROVIDER=openai  # Options: openai, anthropic, together
SUMMARIZATION_API_KEY=your_api_key_here  # Your API key
SUMMARIZATION_API_MODEL=gpt-3.5-turbo  # Model name (e.g., gpt-3.5-turbo, gpt-4, claude-3-haiku)
# SUMMARIZATION_API_BASE_URL=https://api.openai.com/v1  # Optional: custom endpoint

# Processing Configuration
MAX_BLOCK_SIZE=1000
MIN_BLOCK_SIZE=50
BATCH_SIZE=8

# Output Configuration
OUTPUT_DIR=./output
```

## Usage

### Basic Usage

```python
from pathlib import Path
from pipeline import ScientificPaperPipeline

# Initialize pipeline
pipeline = ScientificPaperPipeline()

# Process a PDF
pdf_path = Path("path/to/paper.pdf")
results = pipeline.process_pdf(pdf_path)

# Access results
print(f"Extracted {results['summary']['total_experiments']} experiments")
print(f"Found {results['summary']['sections']} sections")

# Retrieve experiments
experiments = pipeline.get_paper_experiments(results['paper_id'])
for exp in experiments:
    print(f"Protein: {exp.get('protein_name')}")
    print(f"Method: {exp.get('method')}")
```

### Search for Similar Experiments

```python
# Search for similar experiments
query_experiment = {
    "protein_name": "p53",
    "method": "Western blot",
    "observations": "increased expression"
}

similar = pipeline.search_similar_experiments(query_experiment, limit=5)
for result in similar:
    print(f"Score: {result['score']}")
    print(f"Experiment: {result['payload']}")
```

### Run Example

```bash
python example_usage.py
```

## Project Structure

```
.
├── pipeline/
│   ├── __init__.py
│   ├── pdf_to_tei.py          # GROBID integration
│   ├── tei_parser.py          # TEI XML → Blocks JSON
│   ├── block_structurer.py    # Block cleaning & normalization
│   ├── summarizer.py          # Section summarization
│   ├── experiment_extractor.py # Experiment extraction (14B model)
│   ├── vectorizer.py          # Qdrant & ScyllaDB integration
│   ├── orchestrator.py        # Main pipeline orchestrator
│   └── utils.py               # Utility functions
├── models/                    # Model configurations
├── config.py                  # Configuration management
├── requirements.txt
├── setup.ps1                  # PowerShell setup script (Windows)
├── start-services.ps1         # PowerShell script to start services
├── stop-services.ps1          # PowerShell script to stop services
├── example_usage.py           # Example usage script
└── README.md
```

