import { AIMessage, BaseMessage, ToolMessage, isAIMessage } from "@langchain/core/messages";

export function extractText(message: BaseMessage | undefined) {
  if (!message) return "";
  const content = (message as AIMessage).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : (part as any).text ?? ""))
      .filter(Boolean)
      .join("");
  }
  return String(content ?? "");
}

export function getLastAiMessage(messages: BaseMessage[]) {
  return [...messages].reverse().find((msg) => isAIMessage(msg));
}

export function formatToolMessages(messages: ToolMessage[]) {
  const lines = ["I ran the tools and got results:"];
  for (const message of messages) {
    const name = message.name ?? "tool";
    const payload = typeof message.content === "string" ? message.content : "";
    lines.push(`**${name}**\n\`\`\`json\n${payload}\n\`\`\``);
  }
  return lines.join("\n\n");
}

type DashboardLink = { url: string; label: string };

function normalizeSnippet(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const words = cleaned.split(" ");
  return words.slice(0, 12).join(" ") + (words.length > 12 ? "…" : "");
}

function pickLabelFromPayload(payload: any) {
  if (!payload || typeof payload !== "object") return "";
  const fields = [
    "title",
    "heading",
    "name",
    "label",
    "summary",
    "text",
    "content",
  ];
  for (const field of fields) {
    const value = payload[field];
    if (typeof value === "string" && value.trim()) {
      return field === "text" || field === "content"
        ? normalizeSnippet(value)
        : value.trim();
    }
  }
  return "";
}

function labelFromUrl(url: string) {
  if (url.includes("/dashboard/papers/")) return "Paper";
  if (url.includes("/dashboard/sections/")) return "Section";
  if (url.includes("/dashboard/blocks/")) return "Block";
  if (url.includes("/dashboard/items/")) return "Item";
  return "Dashboard";
}

function extractLinksFromPayload(payload: any) {
  if (!payload) return [] as DashboardLink[];
  const links: DashboardLink[] = [];
  const urls = Array.isArray(payload.dashboard_links)
    ? payload.dashboard_links.filter((link: unknown) => typeof link === "string")
    : [];

  const labelHint = pickLabelFromPayload(payload);

  for (const url of urls) {
    const base = labelFromUrl(url);
    const label = labelHint ? `${base}: ${labelHint}` : base;
    links.push({ url, label });
  }
  return links;
}

export function extractDashboardLinks(messages: ToolMessage[]) {
  const links: DashboardLink[] = [];
  for (const message of messages) {
    if (typeof message.content !== "string") continue;
    try {
      const parsed = JSON.parse(message.content);
      if (parsed?.result?.results && Array.isArray(parsed.result.results)) {
        for (const entry of parsed.result.results) {
          links.push(...extractLinksFromPayload({ ...entry.payload, dashboard_links: parsed.dashboard_links }));
        }
      }
      links.push(...extractLinksFromPayload(parsed));
    } catch {
      continue;
    }
  }
  const dedup = new Map<string, DashboardLink>();
  for (const link of links) {
    if (!dedup.has(link.url)) dedup.set(link.url, link);
  }
  return Array.from(dedup.values());
}
