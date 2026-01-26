# Storage

Initialization-only wrappers for Qdrant and Astra DB (CQL). These modules only create clients/sessions; no schema operations or queries are executed here.

## Environment variables

### Qdrant
- `QDRANT_URL`
- `QDRANT_API_KEY`

### Astra (Cassandra)
- `ASTRA_DB_SECURE_CONNECT_BUNDLE`
- `ASTRA_DB_CLIENT_ID`
- `ASTRA_DB_CLIENT_SECRET`
- `ASTRA_DB_KEYSPACE` (optional)

## Files

- `storage/qdrant/client.py` — Qdrant client factory
- `storage/astra/client.py` — Astra client factory
- `storage/schemas/` — Qdrant + Astra schema files
