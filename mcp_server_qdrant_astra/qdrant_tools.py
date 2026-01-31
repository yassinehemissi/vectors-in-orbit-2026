"""Qdrant tools for the MCP server."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from mcp.server.fastmcp import FastMCP
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from dotenv import load_dotenv
load_dotenv()

def _get_client() -> QdrantClient:
    url = os.getenv("QDRANT_URL", "http://localhost:6333")
    api_key = os.getenv("QDRANT_API_KEY")
    return QdrantClient(url=url, api_key=api_key)


def _get_allowed_collections() -> List[str]:
    allowed = os.getenv("QDRANT_ALLOWED_COLLECTIONS", "sections,blocks,items,papers")
    return [c.strip() for c in allowed.split(",") if c.strip()]


def _get_collection(collection: Optional[str]) -> str:
    final_collection = collection or os.getenv("QDRANT_COLLECTION")
    if not final_collection:
        allowed = _get_allowed_collections()
        hint = f" Allowed: {', '.join(allowed)}" if allowed else ""
        raise ValueError(f"collection is required or set QDRANT_COLLECTION.{hint}")

    allowed = _get_allowed_collections()
    if allowed and final_collection not in allowed:
        raise ValueError(
            f"collection '{final_collection}' is not allowed. Allowed: {', '.join(allowed)}"
        )
    return final_collection


def _search_points(
    *,
    collection_name: str,
    query_vector: List[float],
    limit: int = 5,
    with_payload: bool = True,
    score_threshold: Optional[float] = None,
    query_filter: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    client = _get_client()
    qfilter = None
    if query_filter:
        try:
            qfilter = qmodels.Filter.model_validate(query_filter)  # pydantic v2
        except Exception:
            qfilter = qmodels.Filter(**query_filter)

    if hasattr(client, "query_points"):
        results = client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=qfilter,
        )
        points = getattr(results, "points", results)
    elif hasattr(client, "search"):
        results = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=qfilter,
        )
        points = results
    elif hasattr(client, "search_points"):
        results = client.search_points(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=qfilter,
        )
        points = results
    else:
        raise AttributeError("QdrantClient has no search method")
    return {
        "count": len(points),
        "results": [
            r.model_dump() if hasattr(r, "model_dump") else r.dict() if hasattr(r, "dict") else r
            for r in points
        ],
    }


def register_qdrant_tools(mcp: FastMCP) -> None:
    @mcp.tool()
    def health() -> Dict[str, Any]:
        """Health check for the Qdrant connection."""
        client = _get_client()
        info = client.get_collections()
        return {"ok": True, "collections": len(info.collections)}

    @mcp.tool()
    def list_collections() -> Dict[str, Any]:
        """List all collections in Qdrant."""
        client = _get_client()
        info = client.get_collections()
        return info.model_dump() if hasattr(info, "model_dump") else info.dict()

    @mcp.tool()
    def list_allowed_collections() -> Dict[str, Any]:
        """List collections allowed for this MCP server."""
        return {"allowed": _get_allowed_collections()}

    @mcp.tool()
    def upsert_points(
        points: List[Dict[str, Any]],
        collection: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Upsert points into a collection.

        Each point expects: {"id": str|int, "vector": [float], "payload": {..} (optional)}
        """
        client = _get_client()
        collection_name = _get_collection(collection)

        qpoints: List[qmodels.PointStruct] = []
        for p in points:
            qpoints.append(
                qmodels.PointStruct(
                    id=p["id"],
                    vector=p["vector"],
                    payload=p.get("payload"),
                )
            )

        result = client.upsert(collection_name=collection_name, points=qpoints)
        return result.model_dump() if hasattr(result, "model_dump") else result.dict()

    @mcp.tool()
    def search_points(
        query_vector: List[float],
        limit: int = 5,
        collection: Optional[str] = None,
        with_payload: bool = True,
        score_threshold: Optional[float] = None,
        query_filter: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Search points by vector with optional filter."""
        collection_name = _get_collection(collection)
        return _search_points(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )

    @mcp.tool()
    def search_sections(
        query_vector: List[float],
        limit: int = 5,
        with_payload: bool = True,
        score_threshold: Optional[float] = None,
        query_filter: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Search points in the 'sections' collection."""
        return _search_points(
            collection_name=_get_collection("sections"),
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )

    @mcp.tool()
    def search_blocks(
        query_vector: List[float],
        limit: int = 5,
        with_payload: bool = True,
        score_threshold: Optional[float] = None,
        query_filter: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Search points in the 'blocks' collection."""
        return _search_points(
            collection_name=_get_collection("blocks"),
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )

    @mcp.tool()
    def search_items(
        query_vector: List[float],
        limit: int = 5,
        with_payload: bool = True,
        score_threshold: Optional[float] = None,
        query_filter: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Search points in the 'items' collection."""
        return _search_points(
            collection_name=_get_collection("items"),
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )

    @mcp.tool()
    def search_papers(
        query_vector: List[float],
        limit: int = 5,
        with_payload: bool = True,
        score_threshold: Optional[float] = None,
        query_filter: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Search points in the 'papers' collection."""
        return _search_points(
            collection_name=_get_collection("papers"),
            query_vector=query_vector,
            limit=limit,
            with_payload=with_payload,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )

    @mcp.tool()
    def delete_points(
        ids: List[int],
        collection: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Delete points by ID."""
        client = _get_client()
        collection_name = _get_collection(collection)

        result = client.delete(collection_name=collection_name, points_selector=ids)
        return result.model_dump() if hasattr(result, "model_dump") else result.dict()

    @mcp.tool()
    def create_collection(
        vector_size: int,
        distance: str = "Cosine",
        collection: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a collection with the given vector size and distance."""
        client = _get_client()
        collection_name = _get_collection(collection)

        distance_enum = getattr(qmodels.Distance, distance.upper(), qmodels.Distance.COSINE)
        result = client.create_collection(
            collection_name=collection_name,
            vectors_config=qmodels.VectorParams(size=vector_size, distance=distance_enum),
        )
        return {"ok": True, "result": result}
