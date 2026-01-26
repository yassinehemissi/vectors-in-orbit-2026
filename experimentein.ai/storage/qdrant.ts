const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (!QDRANT_URL || !QDRANT_API_KEY) {
  throw new Error("Qdrant env vars are missing.");
}

export type QdrantSearchResult = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

export async function qdrantSearch(params: {
  collection: string;
  vector: number[];
  limit?: number;
}) {
  const response = await fetch(`${QDRANT_URL}/collections/${params.collection}/points/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": QDRANT_API_KEY,
    },
    body: JSON.stringify({
      vector: params.vector,
      limit: params.limit ?? 10,
      with_payload: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qdrant search failed: ${text}`);
  }

  const data = (await response.json()) as { result: QdrantSearchResult[] };
  return data.result ?? [];
}
