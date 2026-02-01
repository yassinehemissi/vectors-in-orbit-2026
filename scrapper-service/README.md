# scrapper-service

Tiny HTTP service that proxies UploadThing operations for the pipeline.

## What it does

- Uploads files to UploadThing
- Checks if a hash already exists (by filename prefix)

## Endpoints

- `GET /health` – health check
- `GET /files/exists/:hash` – returns `{ exists: boolean }`
- `POST /files/upload` – multipart form with `hash`, `path`, and `file`

## Environment Variables

- `UPLOADTHING_TOKEN`
- `PORT` (default: 4010)

## Run

```bash
bun install
bun run dev
```

## Notes

This service is used by `extraction-pipeline-v2/pdf_to_infra` via `SCRAPPER_URL`.
