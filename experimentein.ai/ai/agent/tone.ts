import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  isAIMessage,
} from "@langchain/core/messages";
import { extractText } from "@/ai/agent/messages";

const TONE_RULES = [
  "Rewrite the response so it is ready for the end user.",
  "Return only the final user-facing reply.",
  "Keep markdown if it helps readability, but do not include sections like Summary/Interpretation.",
  "Answer the user question first. If links are needed, put them at the end under a 'Related' heading.",
  "Do not output raw IDs (paper_id, section_id, block_id, item_id or long ID strings). Use labeled links only.",
  "Do not add new facts or claims.",
  "Do not include external URLs; only internal dashboard links are allowed.",
];

function buildPrompt(text: string) {
  return ["Tone the response for the end user.", ...TONE_RULES, "", text].join("\n");
}

export function buildUserTone(model: string) {
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
      new SystemMessage("You rewrite assistant outputs for end users."),
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
