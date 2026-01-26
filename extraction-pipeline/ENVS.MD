# Environment Variables

This project relies on the following environment variables.
# FLASK API 
- `PORT` -- The app port

## LLM / OpenRouter (summarization + extraction)
- `OPENROUTER_API_KEY` — API key for OpenRouter endpoints used by summarization.
- `ESPRIT_API_KEY` — API key for OpenAI‑compatible endpoints used by experiment extraction.
- `ESPRIT_BASE_URL` — Base URL for OpenAI‑compatible providers (e.g., Groq/OpenRouter).

## Qdrant
- `QDRANT_URL` — Qdrant HTTP URL.
- `QDRANT_API_KEY` — Qdrant API key.
- `QDRANT_VECTOR_SIZE` — Vector size (default 768 for `BAAI/bge-base-en-v1.5`).

## Astra (Cassandra)
- `ASTRA_DB_SECURE_CONNECT_BUNDLE` — Path to secure connect bundle zip (optional if using local bundle file).
- `ASTRA_DB_CLIENT_ID` — Astra client ID (optional if using token JSON).
- `ASTRA_DB_CLIENT_SECRET` — Astra client secret (optional if using token JSON).
- `ASTRA_DB_KEYSPACE` — Keyspace to use (optional; if unset, uses driver default).
- `ASTRA_DB_TOKEN_JSON` — Path to token JSON file (optional; defaults to `storage/astra/Experimentein-token.json`).

## Debug
- `HBLOCKS_DEBUG_DIR` — Directory for debug JSONL files (used by `hblocks_to_experiments`).
