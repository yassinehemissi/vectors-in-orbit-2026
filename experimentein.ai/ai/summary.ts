import { DEFAULT_AGENT_MODEL } from "@/lib/agent-models";

interface SummaryParams {
  previousSummary?: string;
  userMessage: string;
  assistantMessage: string;
  model?: string;
}

export async function updateConversationSummary({
  previousSummary,
  userMessage,
  assistantMessage,
  model,
}: SummaryParams) {
  if (!process.env.OPENROUTER_API_KEY) {
    return previousSummary ?? "";
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      ...(process.env.NEXTAUTH_URL
        ? { "HTTP-Referer": process.env.NEXTAUTH_URL }
        : {}),
      "X-Title": "Experimentein.ai",
    },
    body: JSON.stringify({
      model: model ?? DEFAULT_AGENT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You maintain a concise running summary of the conversation. " +
            "Keep it under 1200 characters. Focus on user intent, key facts, and promised follow-ups. " +
            "Return only the updated summary text.",
        },
        {
          role: "user",
          content: `Previous summary:\n${previousSummary ?? "(none)"}\n\nNew exchange:\nUser: ${userMessage}\nAssistant: ${assistantMessage}`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return previousSummary ?? "";
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? (previousSummary ?? "");
}
