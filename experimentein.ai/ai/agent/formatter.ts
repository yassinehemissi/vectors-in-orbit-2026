import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, isAIMessage } from "@langchain/core/messages";
import { extractText } from "@/ai/agent/messages";

const FORMAT_RULES = [
  "Rewrite the response into a clean, consistent markdown structure.",
  "Use headings like '### Title' and '### Summary'.",
  "Use bullet lists for fields (e.g., Source, Relevance, Notes).",
  "Do not include external URLs. Only include internal dashboard links.",
  "Keep content faithful; do not invent papers or details.",
  "If links are present, keep them as markdown links.",
  "If Astra results are used, add a '### Evidence (Astra)' section listing IDs and excerpts, then a '### Interpretation' section.",
  "Answer the user question first. If you include links, put them at the end under '### Related' with meaningful labels only (no raw IDs).",
];

function buildPrompt(text: string) {
  return [
    "Format the response using the rules below.",
    ...FORMAT_RULES,
    "",
    "Response:",
    text,
  ].join("\n");
}

export function buildResponseFormatter(model: string) {
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
    const text = extractText(lastAi);
    if (!text.trim()) {
      return { messages: [] as BaseMessage[] };
    }

    const response = await llm.invoke([
      new SystemMessage("You are a response formatter."),
      new HumanMessage(buildPrompt(text)),
    ]);

    return {
      messages: [
        new AIMessage({
          content: response.content,
          additional_kwargs: lastAi.additional_kwargs,
          response_metadata: lastAi.response_metadata,
        }),
      ],
    };
  };
}
