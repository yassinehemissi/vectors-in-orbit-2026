"""MCP server entrypoint."""

from __future__ import annotations

import os
import inspect
from functools import wraps
from typing import Any, Callable

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

from mcp_server_qdrant_astra.astra_tools import register_astra_tools
from mcp_server_qdrant_astra.mcp_compat import (
    _get_tool_callable,
    _get_tool_mapping,
    try_register_mcp_compliance,
)
from mcp_server_qdrant_astra.openrouter_tools import register_openrouter_tools
from mcp_server_qdrant_astra.qdrant_tools import register_qdrant_tools

load_dotenv()

mcp = FastMCP("qdrant_astra")

register_qdrant_tools(mcp)
register_astra_tools(mcp)
register_openrouter_tools(mcp)
try_register_mcp_compliance(mcp)


def _wrap_tool_calls(mcp_instance: Any) -> None:
    tools = _get_tool_mapping(mcp_instance)
    for name, tool in tools.items():
        func = _get_tool_callable(tool)
        if not callable(func) or getattr(func, "__mcp_logged__", False):
            continue
        name_local = name
        func_local: Callable[..., Any] = func

        if inspect.iscoroutinefunction(func_local):
            @wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                print(f"[mcp] tool call: {name_local} args={kwargs}")
                return await func_local(*args, **kwargs)

            async_wrapper.__mcp_logged__ = True  # type: ignore[attr-defined]
            wrapped = async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                print(f"[mcp] tool call: {name_local} args={kwargs}")
                return func_local(*args, **kwargs)

            sync_wrapper.__mcp_logged__ = True  # type: ignore[attr-defined]
            wrapped = sync_wrapper

        if hasattr(tool, "func"):
            tool.func = wrapped  # type: ignore[assignment]
        elif hasattr(tool, "call"):
            tool.call = wrapped  # type: ignore[assignment]
        elif isinstance(tools, dict):
            tools[name] = wrapped


_wrap_tool_calls(mcp)

def _wrap_call_tool(mcp_instance: Any) -> None:
    if not hasattr(mcp_instance, "call_tool"):
        return
    original = mcp_instance.call_tool
    if getattr(original, "__mcp_logged__", False):
        return

    if inspect.iscoroutinefunction(original):
        @wraps(original)
        async def async_call_tool(name: str, arguments: Any) -> Any:
            print(f"[mcp] call_tool: {name} args={arguments}", flush=True)
            return await original(name, arguments)

        async_call_tool.__mcp_logged__ = True  # type: ignore[attr-defined]
        mcp_instance.call_tool = async_call_tool  # type: ignore[assignment]
    else:
        @wraps(original)
        def sync_call_tool(name: str, arguments: Any) -> Any:
            print(f"[mcp] call_tool: {name} args={arguments}", flush=True)
            return original(name, arguments)

        sync_call_tool.__mcp_logged__ = True  # type: ignore[attr-defined]
        mcp_instance.call_tool = sync_call_tool  # type: ignore[assignment]


_wrap_call_tool(mcp)


def main() -> None:
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    # Support older FastMCP.run signatures that don't accept host/port.
    run_params = inspect.signature(mcp.run).parameters
    if "host" in run_params or "port" in run_params:
        mcp.run(transport=transport, host=host, port=port)
    else:
        mcp.run(transport=transport)


if __name__ == "__main__":
    main()
