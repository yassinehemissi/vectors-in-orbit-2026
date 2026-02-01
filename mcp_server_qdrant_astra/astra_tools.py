"""Astra DB (Data API) tools for the MCP server."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from mcp.server.fastmcp import FastMCP
import requests
from dotenv import load_dotenv
load_dotenv()

def _get_astra_allowed_collections() -> List[str]:
    allowed = os.getenv(
        "ASTRA_ALLOWED_COLLECTIONS", "paper_data,papers,sections,items,blocks"
    )
    return [c.strip() for c in allowed.split(",") if c.strip()]


def _get_astra_collection(collection: Optional[str]) -> str:
    if not collection:
        allowed = _get_astra_allowed_collections()
        hint = f" Allowed: {', '.join(allowed)}" if allowed else ""
        raise ValueError(f"collection is required for Astra DB.{hint}")

    allowed = _get_astra_allowed_collections()
    if allowed and collection not in allowed:
        raise ValueError(
            f"collection '{collection}' is not allowed. Allowed: {', '.join(allowed)}"
        )
    return collection


def _get_astra_base_url() -> str:
    endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
    if not endpoint:
        raise ValueError("ASTRA_DB_API_ENDPOINT is required for Astra DB access")
    return endpoint.rstrip("/")


def _get_astra_namespace() -> str:
    namespace = os.getenv("ASTRA_DB_NAMESPACE")
    if not namespace:
        raise ValueError("ASTRA_DB_NAMESPACE is required for Astra DB access")
    return namespace


def _get_astra_headers() -> Dict[str, str]:
    token = os.getenv("ASTRA_DB_TOKEN")
    if not token:
        raise ValueError("ASTRA_DB_TOKEN is required for Astra DB access")
    return {"X-Cassandra-Token": token}


def _astra_post(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{_get_astra_base_url()}{path}"
    response = requests.post(
        url,
        headers=_get_astra_headers(),
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def register_astra_tools(mcp: FastMCP) -> None:
    @mcp.tool()
    def list_astra_allowed_collections() -> Dict[str, Any]:
        """List Astra DB collections allowed for this MCP server."""
        return {"allowed": _get_astra_allowed_collections()}

    @mcp.tool()
    def astra_find(
        collection: str,
        filter: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Find documents in an Astra DB collection (read-only)."""
        collection_name = _get_astra_collection(collection)
        namespace = _get_astra_namespace()
        payload: Dict[str, Any] = {
            "find": {"filter": filter or {}},
            "options": options or {},
        }
        path = f"/api/json/v1/{namespace}/{collection_name}/find"
        return _astra_post(path, payload)

    @mcp.tool()
    def astra_find_one(
        collection: str,
        filter: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Find a single document in an Astra DB collection (read-only)."""
        collection_name = _get_astra_collection(collection)
        namespace = _get_astra_namespace()
        payload: Dict[str, Any] = {
            "findOne": {"filter": filter or {}},
            "options": options or {},
        }
        path = f"/api/json/v1/{namespace}/{collection_name}/findOne"
        return _astra_post(path, payload)

    @mcp.tool()
    def astra_get_by_id(collection: str, document_id: str) -> Dict[str, Any]:
        """Get a document by id from an Astra DB collection (read-only)."""
        collection_name = _get_astra_collection(collection)
        namespace = _get_astra_namespace()
        payload: Dict[str, Any] = {"findOne": {"filter": {"_id": {"$eq": document_id}}}}
        path = f"/api/json/v1/{namespace}/{collection_name}/findOne"
        return _astra_post(path, payload)

    @mcp.tool()
    def astra_count(collection: str, filter: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Count documents in an Astra DB collection (read-only)."""
        collection_name = _get_astra_collection(collection)
        namespace = _get_astra_namespace()
        payload: Dict[str, Any] = {"countDocuments": {"filter": filter or {}}}
        path = f"/api/json/v1/{namespace}/{collection_name}/countDocuments"
        return _astra_post(path, payload)
