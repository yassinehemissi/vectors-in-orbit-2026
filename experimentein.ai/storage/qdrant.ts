'use server';

import { QdrantClient } from "@qdrant/js-client-rest";

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

const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

export async function qdrantSearch(params: {
  collection: string;
  vector: number[];
  limit?: number;
}) {
  const response = await client.search(params.collection, {
    vector: params.vector,
    limit: params.limit ?? 10,
    with_payload: true,
  });
  console.log(response)
  return (response ?? []) as QdrantSearchResult[];
}
