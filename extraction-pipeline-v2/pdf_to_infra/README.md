# pdf_to_infra

Flask API that ingests a PDF (or a precomputed Docling JSON) and prepares assets for the pipeline.

## What it does

- Calls Docling (unless a Docling file is provided) to get structure and block data.
- Calls GROBID header endpoint to extract metadata.
- Extracts figures (images) and tables (CSV) from the PDF.
- Uploads assets via scrapper-service to UploadThing.
- Stores a `paper_hash` + upload metadata in Astra `papers_data`.

## Inputs

- PDF file
- Optional: Docling JSON file to skip Docling step
- Env vars for Docling/GROBID URLs and scrapper-service

## Outputs

- UploadThing files: PDF, structure JSONs, figures, tables, metadata
- Astra `papers_data` record

## Environment Variables

- `DOCLING_URL`
- `DOCLING_TOKEN` or `DOCLING_API_KEY`
- `GROBID_URL`
- `GROBID_TOKEN` (optional)
- `SCRAPPER_URL` (default: http://127.0.0.1:4010)
- `PORT` (default: 4020)

## Run

```bash
python -m pdf_to_infra.api
```

© BABYNEERS
