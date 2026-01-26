# Storage

Initialization-only wrappers for Qdrant and Astra DB (CQL). These modules only create clients/sessions; no schema operations or queries are executed here.

## Environment variables

### Qdrant
- `QDRANT_URL`
- `QDRANT_API_KEY`
- `QDRANT_VECTOR_SIZE` (default 768)

### Astra (Cassandra)
- `ASTRA_DB_SECURE_CONNECT_BUNDLE` (optional if using local bundle file)
- `ASTRA_DB_CLIENT_ID` (optional if using token JSON)
- `ASTRA_DB_CLIENT_SECRET` (optional if using token JSON)
- `ASTRA_DB_KEYSPACE` (optional)
- `ASTRA_DB_TOKEN_JSON` (optional; defaults to `storage/astra/Experimentein-token.json`)

## Schemas

- `storage/schemas/astra/` — CQL tables for hblocks + experiments
- `storage/schemas/qdrant/` — Qdrant collections for blocks/sections/papers/experiments

## Initialization

Use `init_db.py` (in the extraction-pipeline root) to initialize schemas and payload indexes.
