"""MCP compliance helpers for ADK discovery."""

from __future__ import annotations

import inspect
from typing import Any, Dict, List, Mapping, Optional


def _get_tool_mapping(mcp: Any) -> Mapping[str, Any]:
    if hasattr(mcp, "_tool_manager") and hasattr(mcp._tool_manager, "tools"):
        return mcp._tool_manager.tools  # type: ignore[attr-defined]
    if hasattr(mcp, "_tools"):
        return mcp._tools  # type: ignore[attr-defined]
    if hasattr(mcp, "tools") and isinstance(mcp.tools, Mapping):
        return mcp.tools
    return {}


def _tool_to_spec(tool: Any) -> Dict[str, Any]:
    name = getattr(tool, "name", None) or getattr(tool, "__name__", None)
    description = getattr(tool, "description", None) or getattr(tool, "__doc__", "") or ""
    func = getattr(tool, "func", None)
    if not description and func is not None:
        description = getattr(func, "__doc__", "") or ""
    input_schema = (
        getattr(tool, "input_schema", None)
        or getattr(tool, "parameters", None)
        or getattr(tool, "schema", None)
        or (getattr(func, "input_schema", None) if func is not None else None)
    )
    spec: Dict[str, Any] = {"name": name, "description": description}
    if input_schema:
        spec["inputSchema"] = input_schema
    return spec


def _collect_tool_specs(mcp: Any) -> List[Dict[str, Any]]:
    tools = _get_tool_mapping(mcp)
    specs: List[Dict[str, Any]] = []
    for tool in tools.values():
        spec = _tool_to_spec(tool)
        if spec.get("name"):
            specs.append(spec)
    return specs


def _get_tool_callable(tool: Any) -> Any:
    return getattr(tool, "func", None) or getattr(tool, "call", None) or tool


def _ensure_arguments(arguments: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    return arguments or {}


def try_register_mcp_compliance(mcp: Any) -> None:
    app = getattr(mcp, "app", None)
    if app is None:
        return

    try:
        from fastapi import APIRouter
    except Exception:
        return

    router = APIRouter()

    @router.post("/listTools")
    async def list_tools_endpoint() -> Dict[str, Any]:
        if hasattr(mcp, "list_tools"):
            result = mcp.list_tools()
            if inspect.isawaitable(result):
                result = await result
            return result
        return {"tools": _collect_tool_specs(mcp)}

    @router.post("/callTool")
    async def call_tool_endpoint(payload: Dict[str, Any]) -> Dict[str, Any]:
        name = payload.get("name")
        arguments = _ensure_arguments(payload.get("arguments"))
        if not name:
            raise ValueError("name is required")
        if hasattr(mcp, "call_tool"):
            result = mcp.call_tool(name, arguments)
            if inspect.isawaitable(result):
                result = await result
            return result

        tools = _get_tool_mapping(mcp)
        tool = tools.get(name)
        if tool is None:
            raise ValueError(f"unknown tool: {name}")
        func = _get_tool_callable(tool)
        result = func(**arguments)
        if inspect.isawaitable(result):
            result = await result
        return result

    app.include_router(router)
