import { tool } from "@langchain/core/tools";
import { callMcpTool, parseMcpContent } from "@/ai/agent/mcp";

const searchToolSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Semantic search query." },
    limit: { type: "number" },
    filters: { type: "object", additionalProperties: true },
    score_threshold: { type: "number" },
    collection: { type: "string" },
  },
  required: ["query"],
} as const;

function extractVector(response: any) {
  const payload = parseMcpContent(response);
  if (process.env.MCP_DEBUG === "1" || process.env.MCP_DEBUG === "true") {
    console.log("[MCP] embed_texts parsed payload preview");
    try {
      const text = JSON.stringify(payload, null, 2);
      console.log(
        text.length > 2000
          ? `${text.slice(0, 2000)}... [truncated ${text.length - 2000} chars]`
          : text
      );
    } catch {
      console.log(String(payload));
    }
  }
  if (!payload) return null;

  if (Array.isArray(payload)) return payload[0] ?? null;
  if (Array.isArray(payload.embeddings)) return payload.embeddings[0];
  if (Array.isArray(payload.data)) {
    const first = payload.data[0];
    return first?.embedding ?? first?.vector ?? null;
  }
  return payload.embedding ?? payload.vector ?? null;
}

function collectIds(payloads: any[]) {
  const ids = {
    paper: new Set<string>(),
    section: new Set<string>(),
    block: new Set<string>(),
    item: new Set<string>(),
  };
  for (const payload of payloads) {
    if (!payload || typeof payload !== "object") continue;
    if (typeof payload.paper_id === "string") ids.paper.add(payload.paper_id);
    if (typeof payload.section_id === "string") ids.section.add(payload.section_id);
    if (typeof payload.block_id === "string") ids.block.add(payload.block_id);
    if (typeof payload.item_id === "string") ids.item.add(payload.item_id);
  }
  return ids;
}

function buildDashboardLinks(parsed: any) {
  const payloads: any[] = [];
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item?.payload) payloads.push(item.payload);
      else if (item?.data?.payload) payloads.push(item.data.payload);
    }
  } else if (Array.isArray(parsed?.result?.results)) {
    for (const item of parsed.result.results) {
      if (item?.payload) payloads.push(item.payload);
      else if (item?.data?.payload) payloads.push(item.data.payload);
    }
  } else if (Array.isArray(parsed?.result)) {
    for (const item of parsed.result) {
      if (item?.payload) payloads.push(item.payload);
      else if (item?.data?.payload) payloads.push(item.data.payload);
    }
  } else if (Array.isArray(parsed?.points)) {
    for (const item of parsed.points) {
      if (item?.payload) payloads.push(item.payload);
    }
  }

  const ids = collectIds(payloads);
  const links: string[] = [];
  for (const paperId of ids.paper) {
    links.push(`/dashboard/papers/${paperId}`);
  }
  for (const sectionId of ids.section) {
    const paperId = ids.paper.values().next().value;
    if (paperId) {
      links.push(`/dashboard/sections/${paperId}/${sectionId}`);
    } else {
      links.push("/dashboard/sections/[paper_id]/[section_id]");
      break;
    }
  }
  for (const blockId of ids.block) {
    const paperId = ids.paper.values().next().value;
    if (paperId) {
      links.push(`/dashboard/blocks/${paperId}/${blockId}`);
    } else {
      links.push("/dashboard/blocks/[paper_id]/[block_id]");
      break;
    }
  }
  for (const itemId of ids.item) {
    const paperId = ids.paper.values().next().value;
    if (paperId) {
      links.push(`/dashboard/items/${paperId}/${itemId}`);
    } else {
      links.push("/dashboard/items/[paper_id]/[item_id]");
      break;
    }
  }
  return links;
}

async function embedQuery(query: string) {
  const first = await callMcpTool("embed_texts", { texts: [query] });
  if (first && (first as any).isError) {
    return await callMcpTool("embed_texts", { input: [query] });
  }
  return first;
}

export function createSearchTool(name: string, description: string) {
  return tool(
    async (input) => {
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
        with_payload: true,
      };
      const collection =
        typeof input?.collection === "string" && input.collection.trim()
          ? input.collection.trim()
          : process.env.MCP_QDRANT_COLLECTION;
      if (collection) payload.collection = collection;
      if (input?.filters) payload.query_filter = input.filters;
      if (typeof input?.score_threshold === "number") {
        payload.score_threshold = input.score_threshold;
      }
      const response = await callMcpTool(name, payload);
      const parsed = parseMcpContent(response);
      const dashboard_links = buildDashboardLinks(parsed);
      return {
        ...(parsed && typeof parsed === "object" ? parsed : { result: parsed }),
        dashboard_links,
      };
    },
    {
      name,
      description,
      schema: searchToolSchema,
    }
  );
}

export function buildSearchTools() {
  return [
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
  ];
}
