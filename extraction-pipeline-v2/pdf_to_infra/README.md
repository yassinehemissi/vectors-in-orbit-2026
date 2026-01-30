# pdf_to_infra

Flask API that accepts a PDF, computes a hash key, checks UploadThing via scrapper-service,
then calls a Docling API to get structured JSON (or uses an uploaded Docling JSON), extracts
tables and figures, and uploads artifacts under hash-based folders.

## Layout
- app.py (Flask app factory)
- api.py (entrypoint)
- routes/process.py (HTTP handler)
- services/ (docling, figures, tables, structure, storage)
- utils/ (hash, csv)

## Env
- DOCLING_URL (Docling base URL, e.g. https://...hf.space)
- DOCLING_TOKEN or DOCLING_API_KEY (Authorization: Bearer)
- GROBID_URL (Grobid base URL, e.g. https://...hf.space)
- GROBID_TOKEN (Authorization: Bearer)
- SCRAPPER_URL (default http://127.0.0.1:4010)
- PORT (default 4020)

## Output paths (per hash)
- pdf/original.pdf
- meta/structure.json
- meta/structure_with_offset.json
- meta/figures.json
- meta/metadata.json
- meta/docling.json
- tables/*.csv
- pictures/*.png

## Run
python -m pdf_to_infra.api
