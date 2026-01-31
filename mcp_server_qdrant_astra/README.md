# mcp-server-qdrant-astra

Python MCP server for Qdrant + Astra DB (Data API) + OpenRouter embeddings. Designed to run on Render as an HTTP (SSE) MCP server.

## Structure
- `server.py`: entrypoint, registers tools and starts FastMCP
- `qdrant_tools.py`: Qdrant tools
- `astra_tools.py`: Astra DB Data API tools (read-only)
- `openrouter_tools.py`: OpenRouter embedding tool
- `mcp_compat.py`: MCP listTools/callTool compatibility endpoints

## Env vars
- `QDRANT_URL` (default: `http://localhost:6333`)
- `QDRANT_API_KEY` (optional)
- `QDRANT_COLLECTION` (default collection used by tools)
- `QDRANT_ALLOWED_COLLECTIONS` (default: `sections,blocks,items,papers`)
- `ASTRA_DB_API_ENDPOINT` (required for Astra Data API)
- `ASTRA_DB_TOKEN` (required for Astra Data API)
- `ASTRA_DB_NAMESPACE` (required for Astra Data API)
- `ASTRA_ALLOWED_COLLECTIONS` (default: `paper_data,papers,sections,items,blocks`)
- `OPENROUTER_API_KEY` (required for embeddings)
- `OPENROUTER_EMBEDDING_MODEL` (default: `baai/bge-m3`)
- `MCP_TRANSPORT` (default: `sse`)
- `HOST` (default: `0.0.0.0`)
- `PORT` (default: `8000`, Render sets this automatically)

## Local run
```bash
python -m venv .venv
. .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python server.py
```

## Tools
Qdrant:
- `health`
- `list_collections`
- `list_allowed_collections`
- `create_collection`
- `upsert_points`
- `search_points`
- `search_sections`
- `search_blocks`
- `search_items`
- `search_papers`
- `delete_points`

Astra DB (read-only via Data API):
- `list_astra_allowed_collections`
- `astra_find`
- `astra_find_one`
- `astra_get_by_id`
- `astra_count`

OpenRouter embeddings:
- `embed_texts`

## MCP compliance endpoints
If your client expects direct `listTools` / `callTool` HTTP endpoints, they are available:
- `POST /listTools`
- `POST /callTool` (JSON body: `{ "name": "tool_name", "arguments": { ... } }`)

## Render
`render.yaml` is included. Set your env vars in the Render dashboard.
