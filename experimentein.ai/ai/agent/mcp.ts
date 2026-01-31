import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types";

const APP_NAME = "experimentein-agent";
const MCP_DEBUG = process.env.MCP_DEBUG === "1" || process.env.MCP_DEBUG === "true";

let mcpClient: Client | null = null;
let mcpToolsCache: Record<string, { name: string; description?: string }> | null =
  null;

function parseHeaderJson(value?: string) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    return {};
  }
  return {};
}

function safePreview(value: unknown, max = 2000) {
  try {
    const text = JSON.stringify(value, null, 2);
    if (text.length <= max) return text;
    return `${text.slice(0, max)}... [truncated ${text.length - max} chars]`;
  } catch {
    return String(value);
  }
}

function logMcpDebug(label: string, payload: unknown) {
  if (!MCP_DEBUG) return;
  console.log(`[MCP] ${label}\n${safePreview(payload)}`);
}

function buildMcpHeaders() {
  const headers: Record<string, string> = {};
  const headerJson = parseHeaderJson(process.env.MCP_QDRANT_HEADERS);
  Object.assign(headers, headerJson);

  const apiKey = process.env.MCP_QDRANT_API_KEY;
  if (apiKey) {
    const headerName = process.env.MCP_QDRANT_API_KEY_HEADER || "Authorization";
    if (headerName.toLowerCase() === "authorization") {
      headers[headerName] = apiKey.startsWith("Bearer ")
        ? apiKey
        : `Bearer ${apiKey}`;
    } else {
      headers[headerName] = apiKey;
    }
  }
  return headers;
}

async function getMcpClient() {
  if (!process.env.MCP_QDRANT_URL) return null;
  if (mcpClient) return mcpClient;

  const url = new URL(process.env.MCP_QDRANT_URL);
  mcpClient = new Client({ name: APP_NAME, version: "1.0.0" });
  const headers = buildMcpHeaders();
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: Object.keys(headers).length ? { headers } : undefined,
  });
  await mcpClient.connect(transport);
  return mcpClient;
}

export async function getMcpTools() {
  if (mcpToolsCache) return mcpToolsCache;
  const client = await getMcpClient();
  if (!client) return {};

  const result = await client.request(
    { method: "tools/list", params: {} },
    ListToolsResultSchema
  );
  logMcpDebug("tools/list response", result);
  mcpToolsCache = result.tools.reduce<Record<string, any>>((acc, toolInfo) => {
    acc[toolInfo.name] = toolInfo;
    return acc;
  }, {});
  return mcpToolsCache;
}

export async function callMcpTool(name: string, args: Record<string, any>) {
  const client = await getMcpClient();
  if (!client) {
    throw new Error("MCP toolset is not configured.");
  }

  const tool = await getMcpTools();
  if (!tool[name]) {
    throw new Error(`MCP tool not found: ${name}`);
  }

  const request = {
    method: "tools/call",
    params: { name, arguments: args },
  };
  logMcpDebug("tools/call request", request);
  const response = await client.request(request, CallToolResultSchema);
  logMcpDebug("tools/call response", response);
  return response;
}

export function parseMcpContent(result: any) {
  if (result?.structuredContent) {
    return result.structuredContent;
  }
  if (!result?.content || !Array.isArray(result.content)) return result;

  const textPart = result.content.find(
    (part: any) => part?.type === "text" && typeof part.text === "string"
  );
  if (!textPart?.text) return result;

  try {
    return JSON.parse(textPart.text);
  } catch {
    return textPart.text;
  }
}
