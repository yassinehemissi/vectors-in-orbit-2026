"""MCP server entrypoint."""

from __future__ import annotations

import os

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

from mcp_server_qdrant_astra.astra_tools import register_astra_tools
from mcp_server_qdrant_astra.mcp_compat import try_register_mcp_compliance
from mcp_server_qdrant_astra.openrouter_tools import register_openrouter_tools
from mcp_server_qdrant_astra.qdrant_tools import register_qdrant_tools

load_dotenv()

mcp = FastMCP("qdrant_astra")

register_qdrant_tools(mcp)
register_astra_tools(mcp)
register_openrouter_tools(mcp)
try_register_mcp_compliance(mcp)


def main() -> None:
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    # Support older FastMCP.run signatures that don't accept host/port.
    import inspect

    run_params = inspect.signature(mcp.run).parameters
    if "host" in run_params or "port" in run_params:
        mcp.run(transport=transport, host=host, port=port)
    else:
        mcp.run(transport=transport)


if __name__ == "__main__":
    main()
