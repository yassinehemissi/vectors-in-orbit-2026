import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, isAIMessage } from "@langchain/core/messages";
import { extractText } from "@/ai/agent/messages";

const LINK_RULES = [
  "You must only return links that navigate inside Experimentein.ai.",
  "Never include any external URLs.",
  "Allowed link templates only:",
  "/dashboard/papers/[paper_id]",
  "/dashboard/sections/[paper_id]/[section_id]",
  "/dashboard/blocks/[paper_id]/[block_id]",
  "/dashboard/items/[paper_id]/[item_id]",
  "If you are unsure about an ID, use the template with the placeholder.",
  "Never output empty markdown links like [text]().",
  "If a link is needed but you don't have an ID, include the template as plain text.",
  "Keep the response content the same except for fixing/removing links.",
];

function buildPrompt(text: string) {
  return [
    "Fix the links in the response below.",
    ...LINK_RULES,
    "",
    "Response:",
    text,
  ].join("\n");
}

export function buildLinkFixer(model: string) {
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
      new SystemMessage("You are a response rewriter that only fixes links."),
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
