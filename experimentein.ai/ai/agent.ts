import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { DEFAULT_AGENT_MODEL } from "@/lib/agent-models";
import { buildAgentGraph } from "@/ai/agent/graph";
import {
  extractText,
  formatToolMessages,
  getLastAiMessage,
  extractDashboardLinks,
} from "@/ai/agent/messages";

export async function runAgent(params: {
  userId: string;
  sessionId: string;
  message: string;
  model?: string;
}) {
  const model = params.model ?? DEFAULT_AGENT_MODEL;
  const graph = buildAgentGraph(model);

  const result = await graph.invoke(
    { messages: [new HumanMessage(params.message)] },
    { configurable: { thread_id: params.sessionId } }
  );

  const messages = result.messages ?? [];
  const lastAi = getLastAiMessage(messages);
  const reply = extractText(lastAi);
  const toolMessages = messages.filter(
    (msg) => msg.getType() === "tool"
  ) as ToolMessage[];
  const dashboardLinks = extractDashboardLinks(toolMessages);

  if (reply) {
    if (dashboardLinks.length) {
      const linksBlock = dashboardLinks
        .map((link) => `- [${link.label}](${link.url})`)
        .join("\n");
      return {
        reply: `${reply}\n\nDashboard Links:\n${linksBlock}`,
        model,
        sessionId: params.sessionId,
      };
    }
    return {
      reply,
      model,
      sessionId: params.sessionId,
    };
  }

  if (toolMessages.length) {
    if (dashboardLinks.length) {
      const linksBlock = dashboardLinks
        .map((link) => `- [${link.label}](${link.url})`)
        .join("\n");
      return {
        reply: `Dashboard Links:\n${linksBlock}`,
        model,
        sessionId: params.sessionId,
      };
    }
    return {
      reply: formatToolMessages(toolMessages),
      model,
      sessionId: params.sessionId,
    };
  }

  return {
    reply: "No response returned.",
    model,
    sessionId: params.sessionId,
  };
}
