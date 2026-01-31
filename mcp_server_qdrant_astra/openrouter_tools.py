"""OpenRouter embedding tools for the MCP server."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
load_dotenv()
from mcp.server.fastmcp import FastMCP
import requests


def _get_openrouter_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is required for embeddings")
    return api_key


def _get_openrouter_embedding_model() -> str:
    return os.getenv("OPENROUTER_EMBEDDING_MODEL", "baai/bge-m3")


def _openrouter_post(payload: Dict[str, Any]) -> Dict[str, Any]:
    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {"Authorization": f"Bearer {_get_openrouter_api_key()}"}
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()


def register_openrouter_tools(mcp: FastMCP) -> None:
    @mcp.tool()
    def embed_texts(
        texts: List[str],
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Embed texts via OpenRouter (read-only)."""
        payload = {
            "model": model or _get_openrouter_embedding_model(),
            "input": texts,
        }
        return _openrouter_post(payload)
