# pdf_to_infra

Flask API that ingests a PDF (or a precomputed Docling JSON) and prepares assets for the pipeline.

## What it does
- Calls Docling (unless a Docling file is provided) to get structure and block data.
- Calls Grobid header endpoint to extract metadata.
- Extracts figures (images) and tables (CSV) from the PDF.
- Builds and uploads `structure.json` / `structure_with_offset.json` and asset files to UploadThing.
- Stores a `paper_hash` + JSON pointer bundle in Astra `papers_data`.

## Inputs
- PDF file
- Optional: Docling JSON file to skip Docling step
- Env vars for Docling/Grobid URLs and UploadThing

## Outputs
- UploadThing files: PDF, structure JSONs, figures, tables, metadata
- Astra `papers_data` record

© BABYNEERS
*This is a generated AI README under instructions.*
