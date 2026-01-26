const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL;

if (!OPENROUTER_API_KEY || !OPENROUTER_EMBEDDING_MODEL) {
  throw new Error("OpenRouter embedding env vars are missing.");
}

export async function embedText(text: string) {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0]?.embedding ?? [];
}
