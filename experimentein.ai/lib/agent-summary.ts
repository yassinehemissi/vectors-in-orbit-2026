interface SummaryParams {
  previousSummary?: string;
  userMessage: string;
  assistantMessage: string;
}

const MAX_CHARS = 1200;

export function updateConversationSummary({
  previousSummary,
  userMessage,
  assistantMessage,
}: SummaryParams) {
  const lines = [
    previousSummary?.trim(),
    `User: ${userMessage.trim()}`,
    `Assistant: ${assistantMessage.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (lines.length <= MAX_CHARS) return lines;
  return lines.slice(lines.length - MAX_CHARS);
}
