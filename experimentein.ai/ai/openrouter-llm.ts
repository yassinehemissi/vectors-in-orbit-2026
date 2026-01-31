import { BaseLlm } from "@google/adk";
import type { LlmRequest, LlmResponse } from "@google/adk";
import type { Content } from "@google/genai";

interface OpenRouterLlmParams {
  model: string;
  apiKey: string;
  apiBase?: string;
  referer?: string;
  appTitle?: string;
}

export class OpenRouterLlm extends BaseLlm {
  static readonly supportedModels = [/.*/];
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly referer?: string;
  private readonly appTitle?: string;

  constructor({ model, apiKey, apiBase, referer, appTitle }: OpenRouterLlmParams) {
    super({ model });
    this.apiKey = apiKey;
    this.apiBase = apiBase ?? "https://openrouter.ai/api/v1";
    this.referer = referer;
    this.appTitle = appTitle;
  }

  async *generateContentAsync(
    llmRequest: LlmRequest
  ): AsyncGenerator<LlmResponse, void> {
    const tools = buildTools(llmRequest);

    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(this.referer ? { "HTTP-Referer": this.referer } : {}),
        ...(this.appTitle ? { "X-Title": this.appTitle } : {}),
      },
      body: JSON.stringify({
        model: llmRequest.model ?? this.model,
        messages: buildMessages(llmRequest),
        temperature: llmRequest.config?.temperature,
        tools,
        tool_choice: tools.length ? "auto" : undefined,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      yield { errorCode: String(response.status), errorMessage: message };
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const message = data.choices?.[0]?.message;
    const toolCalls = message?.tool_calls ?? [];
    const content = message?.content ?? "";

    if (toolCalls.length) {
      yield {
        content: {
          role: "model",
          parts: toolCalls.map((call) => ({
            functionCall: {
              id: call.id,
              name: call.function.name,
              args: safeJsonParse(call.function.arguments),
            },
          })),
        },
      };
      return;
    }

    yield {
      content: {
        role: "model",
        parts: [{ text: content ?? "" }],
      },
    };
  }

  async connect(): Promise<never> {
    throw new Error("Streaming is not implemented for OpenRouter.");
  }
}

function buildMessages(llmRequest: LlmRequest) {
  const messages: Array<Record<string, any>> = [];
  const systemText = extractSystemInstruction(llmRequest.config?.systemInstruction);
  if (systemText) {
    messages.push({ role: "system", content: systemText });
  }

  for (const content of llmRequest.contents ?? []) {
    const role = content.role === "model" ? "assistant" : content.role ?? "user";

    if (content.parts?.length) {
      for (const part of content.parts) {
        const response = (part as any).functionResponse;
        if (response) {
          messages.push({
            role: "tool",
            content: JSON.stringify(response.response ?? {}),
            ...(response.name ? { name: response.name } : {}),
            ...(response.id ? { tool_call_id: response.id } : {}),
          });
        }
      }
    }

    const text = extractText(content);
    if (text) messages.push({ role, content: text });
  }

  return messages;
}

function buildTools(llmRequest: LlmRequest) {
  const dict = llmRequest.toolsDict ?? {};
  const entries = Object.entries(dict);
  if (!entries.length) return [];

  return entries
    .map(([name, tool]) => {
      const decl = (tool as any)._getDeclaration?.() ?? (tool as any).getDeclaration?.();
      if (!decl) return null;
      return {
        type: "function" as const,
        function: {
          name: decl.name ?? name,
          description: decl.description,
          parameters: decl.parameters ?? { type: "object", properties: {} },
        },
      };
    })
    .filter(Boolean);
}

function extractText(content: Content) {
  if (!content?.parts?.length) return "";
  return content.parts
    .map((part) => ("text" in part ? part.text : ""))
    .filter(Boolean)
    .join("");
}

function extractSystemInstruction(systemInstruction?: unknown) {
  if (!systemInstruction) return "";
  if (Array.isArray(systemInstruction)) {
    return systemInstruction
      .map((part) => ("text" in part ? part.text : ""))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof systemInstruction === "object" && systemInstruction !== null) {
    return extractText(systemInstruction as Content);
  }
  return String(systemInstruction ?? "");
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return { _raw: value };
  }
}
