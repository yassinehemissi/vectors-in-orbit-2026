"use server";

import { qdrantSearch } from "@/storage/qdrant";
import { embedTextWithUsage } from "@/storage/embeddings";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { recordUsageReceipt } from "@/lib/credits/usage";
import { resolveUsageTokens } from "@/lib/usage/tokens";
import type { NormalizedSearchResult, SearchMode } from "./types";
import { fetchByMode, getModeConfig } from "./fetch";
import {
  normalizeBlocks,
  normalizeExperiments,
  normalizePapers,
  normalizeSections,
} from "./normalize";

export async function searchExperiments(query: string) {
  return searchContent(query, "experiments");
}

export async function searchContent(
  query: string,
  mode: SearchMode,
): Promise<NormalizedSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  let vector: number[] = [];
  let usage: Record<string, unknown> | null = null;
  try {
    const embedded = await embedTextWithUsage(query);
    vector = embedded.embedding;
    usage = embedded.usage;
  } catch {
    return [];
  }

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (email) {
      await connectToDatabase();
      const user = await User.findOne({ email });
      if (user?.creditAccountId) {
        const tokenUsage = resolveUsageTokens({
          providerUsage: usage,
          input: query,
        });
        const creditsCharged = Math.max(
          1,
          Math.ceil(tokenUsage.totalTokens / 1000),
        );
        await recordUsageReceipt({
          userId: user._id,
          creditAccountId: user.creditAccountId,
          actionType: "search_embed",
          model: process.env.OPENROUTER_EMBEDDING_MODEL ?? "openrouter-embedding",
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          creditsCharged,
          requestId: `search-${Date.now()}`,
          metadata: {
            mode,
            estimated: tokenUsage.estimated,
          },
        });
      }
    }
  } catch {
    // usage logging should not block search
  }

  const { collection } = getModeConfig(mode);
  const results = await qdrantSearch({
    collection,
    vector,
    limit: 8,
  });

  const payloads = results.map((result) => result.payload ?? {});
  const rows = await fetchByMode(mode, payloads);

  if (mode === "papers") return normalizePapers(rows);
  if (mode === "sections") return normalizeSections(rows);
  if (mode === "blocks") return normalizeBlocks(rows);
  return normalizeExperiments(rows);
}
