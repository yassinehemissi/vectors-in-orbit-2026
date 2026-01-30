import { BaseLlm } from "@google/adk";
import type { LlmRequest } from "@google/adk";
import type { LlmResponse } from "@google/adk";
import type { Content } from "@google/genai";

interface OpenRouterLlmParams {
  model: string;
  apiKey: string;
  baseUrl?: string;
  referer?: string;
  appTitle?: string;
}

export class OpenRouterLlm extends BaseLlm {
  static readonly supportedModels = [/.*/];
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly referer?: string;
  private readonly appTitle?: string;

  constructor({ model, apiKey, baseUrl, referer, appTitle }: OpenRouterLlmParams) {
    super({ model });
    this.apiKey = apiKey;
    this.baseUrl = baseUrl ?? "https://openrouter.ai/api/v1";
    this.referer = referer;
    this.appTitle = appTitle;
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    _stream = false
  ): AsyncGenerator<LlmResponse, void> {
    const messages = this.buildMessages(llmRequest);
    const temperature = llmRequest.config?.temperature;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(this.referer ? { "HTTP-Referer": this.referer } : {}),
        ...(this.appTitle ? { "X-Title": this.appTitle } : {}),
      },
      body: JSON.stringify({
        model: llmRequest.model ?? this.model,
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      yield {
        errorCode: String(response.status),
        errorMessage: message,
      };
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: Record<string, unknown>;
    };

    const content = data.choices?.[0]?.message?.content ?? "";

    yield {
      content: {
        role: "model",
        parts: [{ text: content }],
      },
    };
  }

  async connect(): Promise<never> {
    throw new Error("OpenRouter streaming is not implemented.");
  }

  private buildMessages(llmRequest: LlmRequest) {
    const messages: Array<{ role: string; content: string }> = [];

    const systemText = this.extractSystemInstruction(llmRequest.config?.systemInstruction);
    if (systemText) {
      messages.push({ role: "system", content: systemText });
    }

    for (const content of llmRequest.contents ?? []) {
      const role = content.role === "model" ? "assistant" : content.role ?? "user";
      const text = this.extractText(content);
      if (!text) continue;
      messages.push({ role, content: text });
    }

    return messages;
  }

  private extractText(content: Content) {
    if (!content?.parts?.length) return "";
    return content.parts
      .map((part) => ("text" in part ? part.text : ""))
      .filter(Boolean)
      .join("");
  }

  private extractSystemInstruction(systemInstruction?: unknown) {
    if (!systemInstruction) return "";
    if (Array.isArray(systemInstruction)) {
      return systemInstruction
        .map((part) => ("text" in part ? part.text : ""))
        .filter(Boolean)
        .join(" ");
    }
    if (typeof systemInstruction === "object" && systemInstruction !== null) {
      const maybeContent = systemInstruction as Content;
      return this.extractText(maybeContent);
    }
    return "";
  }
}
