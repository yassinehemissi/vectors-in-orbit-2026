# Quick Start Guide

## Prerequisites Checklist

Before running the pipeline, ensure you have:

- [ ] **Docker Desktop installed** (required - see [DOCKER_SETUP.md](DOCKER_SETUP.md))
- [ ] Python 3.8+ installed
- [ ] GROBID service running (via Docker)
- [ ] Qdrant vector database running (via Docker)
- [ ] ScyllaDB running (via Docker)
- [ ] `.env` file configured

## Step-by-Step Setup

### Windows (PowerShell) - Quick Setup

For Windows users, use the automated PowerShell scripts:

```powershell
# Full automated setup
.\setup.ps1

# Or start services only
.\start-services.ps1
```

### Manual Setup

#### 1. Install Python Dependencies

**Windows (PowerShell):**
```powershell
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
pip install -r requirements.txt
```

#### 2. Start Required Services

**GROBID:**
```bash
docker run -d -p 8070:8070 lfoppiano/grobid:0.8.1
```

**Qdrant:**
```bash
docker run -d -p 6333:6333 qdrant/qdrant
```

**ScyllaDB:**
```bash
docker run -d -p 9042:9042 scylladb/scylla
```

**Windows PowerShell (automated):**
```powershell
.\start-services.ps1
```

#### 3. Configure Environment

Copy the example environment variables and adjust as needed:

**Windows (PowerShell):**
```powershell
# The setup.ps1 script creates .env automatically
# Or create manually:
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
# Create .env file with your configuration
# See README.md for all available options
```

#### 4. Test the Pipeline

```bash
python example_usage.py
```

## Pipeline Flow

```
PDF Paper
    ↓
[GROBID] → TEI XML
    ↓
[TEI Parser] → Blocks JSON
    ↓
[Block Structurer] → Clean Section Packets
    ↓
[Summarizer] → Compressed Summaries
    ↓
[Experiment Extractor] → Structured Experiments
    ↓
[Vectorizer] → Qdrant (semantic search)
[Storage] → ScyllaDB (persistent storage)
```

## Key Components

1. **PDFToTEIConverter**: Converts PDFs to TEI XML using GROBID
2. **TEIParser**: Parses TEI XML into structured blocks
3. **BlockStructurer**: Cleans and normalizes blocks into semantic units
4. **Summarizer**: Compresses sections using small models
5. **ExperimentExtractor**: Extracts structured experiments using large model
6. **Vectorizer**: Creates embeddings and stores in Qdrant
7. **Storage**: Stores structured data in ScyllaDB

## Troubleshooting

### GROBID not available
- **Windows:** Check if GROBID is running: `Invoke-WebRequest http://localhost:8070/api/isalive`
- **Linux/Mac:** Check if GROBID is running: `curl http://localhost:8070/api/isalive`
- Verify Docker container is running: `docker ps`
- **Windows:** Use `.\start-services.ps1` to restart services

### Model loading fails
- Check available disk space (models can be large)
- For GPU: Ensure CUDA is properly installed
- For CPU: Models will load but may be slow
- Check Python version: `python --version` (requires 3.8+)

### Database connection errors
- **Windows:** Verify Qdrant: `Invoke-WebRequest http://localhost:6333/collections`
- **Linux/Mac:** Verify Qdrant: `curl http://localhost:6333/collections`
- **Windows:** Verify ScyllaDB: `docker ps --filter "name=scylla"`
- **Linux/Mac:** Verify ScyllaDB: `docker ps | grep scylla`
- Check connection strings in `.env` file
- **Windows:** Use `.\stop-services.ps1` and `.\start-services.ps1` to restart

## Performance Tips

1. **GPU Acceleration**: Set `DEVICE=cuda` in `.env` for faster processing
2. **Model Quantization**: Install `bitsandbytes` for 8-bit model loading
3. **Batch Processing**: Adjust `BATCH_SIZE` in config for optimal throughput
4. **Block Sizing**: Tune `MAX_BLOCK_SIZE` and `MIN_BLOCK_SIZE` based on your papers

## Next Steps

- Process your first PDF paper
- Explore extracted experiments
- Search for similar experiments
- Customize extraction prompts for your domain

