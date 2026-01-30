type UsageInput = string | string[];

export type UsageTokens = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimated: boolean;
};

function estimateTokensFromText(text: string) {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateTokensFromInput(input?: UsageInput) {
  if (!input) {
    return 0;
  }
  if (Array.isArray(input)) {
    return input.reduce((sum, chunk) => sum + estimateTokensFromText(chunk), 0);
  }
  return estimateTokensFromText(input);
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function resolveUsageTokens({
  providerUsage,
  input,
  output,
}: {
  providerUsage?: Record<string, unknown> | null;
  input?: UsageInput;
  output?: string;
}): UsageTokens {
  const usage = providerUsage ?? {};

  const inputTokens =
    readNumber(usage.input_tokens) ??
    readNumber(usage.prompt_tokens) ??
    readNumber(usage.inputTokens) ??
    readNumber(usage.promptTokens) ??
    estimateTokensFromInput(input);

  const outputTokens =
    readNumber(usage.output_tokens) ??
    readNumber(usage.completion_tokens) ??
    readNumber(usage.outputTokens) ??
    readNumber(usage.completionTokens) ??
    estimateTokensFromText(output ?? "");

  const totalTokens =
    readNumber(usage.total_tokens) ??
    readNumber(usage.totalTokens) ??
    inputTokens + outputTokens;

  const estimated =
    readNumber(usage.input_tokens) === null &&
    readNumber(usage.prompt_tokens) === null &&
    readNumber(usage.output_tokens) === null &&
    readNumber(usage.completion_tokens) === null;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimated,
  };
}
