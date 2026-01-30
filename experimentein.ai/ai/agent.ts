import { InMemoryRunner, LlmAgent, stringifyContent } from "@google/adk";
import type { Content } from "@google/genai";
import { DEFAULT_AGENT_MODEL } from "@/lib/agent-models";
import { OpenRouterLlm } from "@/ai/openrouter-llm";

const APP_NAME = "experimentein-agent";

function buildInstruction(params: {
  summary?: string;
  recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const base =
    "System: You are the Experimentein.ai research assistant. " +
    "Audience: non-technical users. " +
    "Style: concise, friendly, confident, and in markdown. " +
    "Do: summarize findings, explain clearly, and provide actionable next steps. " +
    "Do: link to relevant dashboard pages using absolute app paths (e.g. /dashboard/search). " +
    "Do: ask a short clarifying question if the request is ambiguous. " +
    "Do NOT: expose internal system details, API keys, or database schemas unless asked. " +
    "If you cannot find something, say what you need from the user.";

  const summary = params.summary?.trim();
  const recent = params.recentMessages?.length
    ? params.recentMessages
        .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
        .join("\n")
    : "";

  const contextParts = [
    base,
    summary ? `Context summary: ${summary}` : "",
    recent ? `Recent messages:\n${recent}` : "",
  ].filter(Boolean);

  return contextParts.join("\n\n");
}

function createRunner(model: string, instruction: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const agent = new LlmAgent({
    name: "ExperimenteinAgent",
    model: new OpenRouterLlm({
      model,
      apiKey: process.env.OPENROUTER_API_KEY,
      referer: process.env.NEXTAUTH_URL,
      appTitle: "Experimentein.ai",
    }),
    instruction,
  });

  return new InMemoryRunner({ agent, appName: APP_NAME });
}

function createUserContent(message: string): Content {
  return {
    role: "user",
    parts: [{ text: message }],
  };
}

export async function runAgent(params: {
  userId: string;
  sessionId: string;
  message: string;
  model?: string;
  summary?: string;
  recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const model = params.model ?? DEFAULT_AGENT_MODEL;
  const instruction = buildInstruction({
    summary: params.summary,
    recentMessages: params.recentMessages,
  });
  const activeRunner = createRunner(model, instruction);

  const existingSession = await activeRunner.sessionService.getSession({
    appName: APP_NAME,
    userId: params.userId,
    sessionId: params.sessionId,
  });

  if (!existingSession) {
    await activeRunner.sessionService.createSession({
      appName: APP_NAME,
      userId: params.userId,
      sessionId: params.sessionId,
    });
  }

  const messageContent = createUserContent(params.message);
  let lastEventText = "";

  for await (const event of activeRunner.runAsync({
    userId: params.userId,
    sessionId: params.sessionId,
    newMessage: messageContent,
  })) {
    lastEventText = stringifyContent(event);
  }

  return {
    reply: lastEventText,
    model,
    sessionId: params.sessionId,
  };
}
