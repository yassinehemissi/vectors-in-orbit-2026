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

function extractLinksFromPayload(payload: any) {
  if (!payload) return [];
  if (Array.isArray(payload.dashboard_links)) {
    return payload.dashboard_links.filter((link) => typeof link === "string");
  }
  return [];
}

export function extractDashboardLinks(messages: ToolMessage[]) {
  const links: string[] = [];
  for (const message of messages) {
    if (typeof message.content !== "string") continue;
    try {
      const parsed = JSON.parse(message.content);
      links.push(...extractLinksFromPayload(parsed));
    } catch {
      continue;
    }
  }
  return Array.from(new Set(links));
}
