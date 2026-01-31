import { AIMessage, BaseMessage, isAIMessage } from "@langchain/core/messages";

const LINK_PATTERNS: Array<{ regex: RegExp; template: string }> = [
  { regex: /\/dashboard\/papers\/[^\s)]+/gi, template: "/dashboard/papers/[paper_id]" },
  {
    regex: /\/dashboard\/sections\/[^/\s)]+\/[^\s)]+/gi,
    template: "/dashboard/sections/[paper_id]/[section_id]",
  },
  {
    regex: /\/dashboard\/blocks\/[^/\s)]+\/[^\s)]+/gi,
    template: "/dashboard/blocks/[paper_id]/[block_id]",
  },
  {
    regex: /\/dashboard\/items\/[^/\s)]+\/[^\s)]+/gi,
    template: "/dashboard/items/[paper_id]/[item_id]",
  },
];

const UNKNOWN_DASHBOARD_LINK = /\/dashboard\/[^\s)]+/gi;

function normalizeLinks(text: string) {
  let output = text;
  for (const { regex, template } of LINK_PATTERNS) {
    output = output.replace(regex, template);
  }
  output = output.replace(UNKNOWN_DASHBOARD_LINK, "");
  output = output.replace(/\[[^\]]*?\]\(\s*\)/g, "");
  output = output.replace(/\s{2,}/g, " ").replace(/\s+\n/g, "\n");
  return output.trim();
}

function sanitizeMessageContent(message: AIMessage) {
  const content = message.content;
  if (typeof content === "string") {
    return normalizeLinks(content);
  }
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") {
        return normalizeLinks(part);
      }
      if ("text" in part && typeof part.text === "string") {
        return { ...part, text: normalizeLinks(part.text) };
      }
      return part;
    });
  }
  return content;
}

export function buildLinkSanitizer() {
  return (state: { messages: BaseMessage[] }) => {
    const lastAi = [...state.messages].reverse().find((msg) => isAIMessage(msg));
    if (!lastAi || !isAIMessage(lastAi)) {
      return { messages: [] as BaseMessage[] };
    }
    const sanitizedContent = sanitizeMessageContent(lastAi);
    if (sanitizedContent === lastAi.content) {
      return { messages: [] as BaseMessage[] };
    }
    return {
      messages: [
        new AIMessage({
          content: sanitizedContent,
          additional_kwargs: lastAi.additional_kwargs,
          response_metadata: lastAi.response_metadata,
        }),
      ],
    };
  };
}
