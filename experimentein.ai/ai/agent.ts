import {
  FunctionTool,
  InMemoryRunner,
  LlmAgent,
  MCPToolset,
  isFinalResponse,
} from "@google/adk";
import type { Content, Schema } from "@google/genai";
import { DEFAULT_AGENT_MODEL } from "@/lib/agent-models";
import { OpenRouterLlm } from "@/ai/openrouter-llm";

const APP_NAME = "experimentein-agent";

function buildInstruction() {
  return [
    "You are the Experimentein.ai research assistant.",
    "Use MCP tools to search Qdrant when asked.",
    "Never fabricate results; if tools are unavailable, say so.",
    "Answer in markdown and include dashboard links when possible:",
    "/dashboard/papers/[paper_id]",
    "/dashboard/sections/[paper_id]/[section_id]",
    "/dashboard/blocks/[paper_id]/[block_id]",
    "/dashboard/items/[paper_id]/[item_id]",
  ].join(" ");
}

const mcpToolset = process.env.MCP_QDRANT_URL
  ? new MCPToolset({
      type: "StreamableHTTPConnectionParams",
      url: process.env.MCP_QDRANT_URL,
    })
  : null;

let mcpToolCache: Record<string, any> | null = null;

async function getMcpTools() {
  if (!mcpToolset) return {};
  if (mcpToolCache) return mcpToolCache;
  const tools = await mcpToolset.getTools();
  mcpToolCache = tools.reduce<Record<string, any>>((acc, tool) => {
    acc[tool.name] = tool;
    return acc;
  }, {});
  return mcpToolCache;
}

async function callMcpTool(name: string, args: Record<string, any>) {
  const tools = await getMcpTools();
  const tool = tools[name];
  if (!tool) {
    throw new Error(`MCP tool not found: ${name}`);
  }
  return tool.runAsync({ args, toolContext: undefined });
}

function extractVector(response: any) {
  if (!response) return null;

  // MCP responses may wrap content as: { content: [{ type: "text", text: "..." }] }
  if (response.content && Array.isArray(response.content)) {
    const textPart = response.content.find((part: any) => part?.type === "text");
    if (textPart?.text) {
      try {
        const parsed = JSON.parse(textPart.text);
        return extractVector(parsed);
      } catch {
        return null;
      }
    }
  }

  // Direct shapes
  if (Array.isArray(response)) return response[0] ?? null;
  if (Array.isArray(response.embeddings)) return response.embeddings[0];
  if (Array.isArray(response.data)) {
    const first = response.data[0];
    return first?.embedding ?? first?.vector ?? null;
  }
  return response.embedding ?? response.vector ?? null;
}

async function embedQuery(query: string) {
  try {
    return await callMcpTool("embed_texts", { input: [query] });
  } catch {
    return await callMcpTool("embed_texts", { texts: [query] });
  }
}

function searchToolSchema(): Schema {
  return {
    type: "object",
    properties: {
      query: { type: "string" },
      limit: { type: "number" },
      filters: { type: "object", additionalProperties: true },
    },
    required: ["query"],
  };
}

function createSearchTool(name: string, description: string) {
  return new FunctionTool({
    name,
    description,
    parameters: searchToolSchema(),
    execute: async (input: any) => {
      const query = String(input?.query ?? "").trim();
      const limit = typeof input?.limit === "number" ? input.limit : 5;
      if (!query) {
        return { error: "Query is required." };
      }
      const embedResponse = await embedQuery(query);
      const vector = extractVector(embedResponse);
      if (!vector) {
        return { error: "Embedding failed.", embedResponse };
      }
      const payload: Record<string, any> = {
        query_vector: vector,
        limit,
      };
      if (input?.filters) payload.filters = input.filters;
      return callMcpTool(name, payload);
    },
  });
}

function createRunner(model: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const tools = mcpToolset
    ? [
        createSearchTool(
          "search_papers",
          "Search papers by semantic query and return paper matches."
        ),
        createSearchTool(
          "search_sections",
          "Search sections by semantic query and return section matches."
        ),
        createSearchTool(
          "search_blocks",
          "Search blocks by semantic query and return block matches."
        ),
        createSearchTool(
          "search_items",
          "Search items by semantic query and return item matches."
        ),
        createSearchTool(
          "search_points",
          "Search raw vector points by semantic query."
        ),
      ]
    : [];

  const agent = new LlmAgent({
    name: "ExperimenteinAgent",
    model: new OpenRouterLlm({
      model,
      apiKey: process.env.OPENROUTER_API_KEY,
      apiBase: process.env.OPENROUTER_API_BASE,
      referer: process.env.NEXTAUTH_URL,
      appTitle: "Experimentein.ai",
    }),
    instruction: buildInstruction(),
    tools,
  });

  return new InMemoryRunner({ agent, appName: APP_NAME });
}

function createUserContent(message: string): Content {
  return { role: "user", parts: [{ text: message }] };
}

export async function runAgent(params: {
  userId: string;
  sessionId: string;
  message: string;
  model?: string;
}) {
  const model = params.model ?? DEFAULT_AGENT_MODEL;
  const runner = createRunner(model);

  const existing = await runner.sessionService.getSession({
    appName: APP_NAME,
    userId: params.userId,
    sessionId: params.sessionId,
  });

  if (!existing) {
    await runner.sessionService.createSession({
      appName: APP_NAME,
      userId: params.userId,
      sessionId: params.sessionId,
    });
  }

  const messageContent = createUserContent(params.message);
  let lastText = "";
  let sawFinal = false;
  const toolResponses: Array<{ name?: string; response?: any }> = [];

  for await (const event of runner.runAsync({
    userId: params.userId,
    sessionId: params.sessionId,
    newMessage: messageContent,
  })) {
    if (event.content?.parts?.length) {
      const text = event.content.parts
        .map((part) =>
          typeof (part as any).text === "string" ? (part as any).text : ""
        )
        .filter(Boolean)
        .join("");
      if (text) lastText = text;
      for (const part of event.content.parts as any[]) {
        const fnResponse = (part as any).functionResponse ?? (part as any).function_response;
        if (fnResponse) {
          toolResponses.push({
            name: fnResponse.name,
            response: fnResponse.response,
          });
        }
      }
    }
    if (isFinalResponse(event)) {
      sawFinal = true;
    }
  }

  if (!lastText && toolResponses.length) {
    return {
      reply: formatToolResponses(toolResponses),
      model,
      sessionId: params.sessionId,
    };
  }

  return {
    reply: lastText || (sawFinal ? "No response returned." : "Waiting on tools."),
    model,
    sessionId: params.sessionId,
  };
}

function formatToolResponses(
  toolResponses: Array<{ name?: string; response?: any }>
) {
  const lines = ["I ran the tools and got results:"];
  for (const entry of toolResponses) {
    const label = entry.name ? `**${entry.name}**` : "**tool**";
    const payload =
      typeof entry.response === "string"
        ? entry.response
        : JSON.stringify(entry.response ?? {}, null, 2);
    lines.push(`${label}\n\`\`\`json\n${payload}\n\`\`\``);
  }
  return lines.join("\n\n");
}
