import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  isAIMessage,
  isHumanMessage,
  isSystemMessage,
} from "@langchain/core/messages";
import { extractText } from "@/ai/agent/messages";

const CRITIC_RULES = [
  "Check the response for hallucinations or claims not supported by user context or tool outputs.",
  "If the user asked to interpret/analyze results, ensure Astra text was retrieved via Astra tools before answering.",
  "If Astra text was not retrieved, set status to rewrite and ask to run Astra tools or state limitation.",
  "If tools are not used or unavailable, do not fabricate results; acknowledge limitations.",
  "Never include external URLs. Only internal dashboard links are allowed.",
  "Keep tone helpful and concise; preserve markdown when possible.",
  "Return JSON only using the exact schema below.",
  "If the response is correct, set status to approved and echo the original response.",
  "If issues exist, set status to rewrite and provide a corrected response.",
];

const CRITIC_SCHEMA = [
  "{",
  '  "status": "approved" | "rewrite",',
  '  "response": "string"',
  "}",
].join("\n");

function truncate(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}... [truncated]`;
}

function buildPrompt(input: {
  summary: string;
  lastUser: string;
  toolOutputs: string;
  response: string;
}) {
  return [
    "You are an adversarial reviewer for an AI assistant response.",
    ...CRITIC_RULES,
    "",
    "Return JSON only. Schema:",
    CRITIC_SCHEMA,
    "",
    input.summary ? `Conversation summary:\n${input.summary}` : "Conversation summary: (none)",
    "",
    input.lastUser ? `Last user message:\n${input.lastUser}` : "Last user message: (none)",
    "",
    input.toolOutputs ? `Tool outputs:\n${input.toolOutputs}` : "Tool outputs: (none)",
    "",
    "Response to review:",
    input.response,
  ].join("\n");
}

export function buildAdversarialCritic(model: string) {
  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: process.env.OPENROUTER_API_BASE ?? "https://openrouter.ai/api/v1",
    },
    temperature: 0,
  });

  return async (state: { messages: BaseMessage[] }) => {
    const lastAi = [...state.messages].reverse().find((msg) => isAIMessage(msg));
    if (!lastAi || !isAIMessage(lastAi)) {
      return { messages: [] as BaseMessage[] };
    }

    const responseText = extractText(lastAi);
    if (!responseText.trim()) {
      return { messages: [] as BaseMessage[] };
    }

    const lastUser = [...state.messages]
      .reverse()
      .find((msg) => isHumanMessage(msg)) as BaseMessage | undefined;

    const summary = state.messages.find((msg) => {
      if (!isSystemMessage(msg)) return false;
      const text = extractText(msg);
      return text.includes("Conversation summary");
    });

    const toolMessages = state.messages.filter(
      (msg) => msg.getType() === "tool"
    ) as ToolMessage[];

    const toolOutputs = toolMessages
      .map((msg) => {
        const name = msg.name ?? "tool";
        const content = typeof msg.content === "string" ? msg.content : "";
        return `## ${name}\n${truncate(content, 1200)}`;
      })
      .join("\n\n");

    const prompt = buildPrompt({
      summary: truncate(extractText(summary), 1200),
      lastUser: truncate(extractText(lastUser), 1200),
      toolOutputs: truncate(toolOutputs, 2400),
      response: responseText,
    });

    const reviewed = await llm.invoke([
      new SystemMessage("You are a strict, adversarial response reviewer."),
      new HumanMessage(prompt),
    ]);

    const raw = extractText(reviewed as BaseMessage).trim();
    const parsed = safeParseCriticJson(raw);
    const finalText =
      parsed?.response?.trim() ||
      (raw.startsWith("{") ? responseText : raw) ||
      responseText;

    return {
      messages: [
        new AIMessage({
          content: finalText,
          additional_kwargs: lastAi.additional_kwargs,
          response_metadata: lastAi.response_metadata,
        }),
      ],
    };
  };
}

function safeParseCriticJson(text: string) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;
    const status = parsed.status;
    const response = parsed.response;
    if (status !== "approved" && status !== "rewrite") return null;
    if (typeof response !== "string") return null;
    return { status, response };
  } catch {
    return null;
  }
}
