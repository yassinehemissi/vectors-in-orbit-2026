"use server";

import { getAstraClient } from "./astra";
import { qdrantSearch } from "./qdrant";
import { embedTextWithUsage } from "./embeddings";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { recordUsageReceipt } from "@/lib/credits/usage";
import { resolveUsageTokens } from "@/lib/usage/tokens";

export type SearchMode = "papers" | "sections" | "blocks" | "experiments";

export type NormalizedSearchResult = {
  kind: SearchMode;
  id: string;
  title: string;
  summary?: string;
  paperId?: string;
  sectionId?: string;
  blockId?: string;
  experimentId?: string;
  tag?: string;
};

const modeMap: Record<SearchMode, { collection: string; idKey: string }> = {
  papers: { collection: "hblocks_papers", idKey: "paper_id" },
  sections: { collection: "hblocks_sections", idKey: "section_id" },
  blocks: { collection: "hblocks_blocks", idKey: "block_id" },
  experiments: { collection: "experiments", idKey: "experiment_id" },
};

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

  const { collection, idKey } = modeMap[mode];
  const results = await qdrantSearch({
    collection,
    vector,
    limit: 8,
  });

  const payloads = results.map((result) => result.payload ?? {});
  const ids = payloads
    .map((payload) => payload[idKey])
    .filter((id): id is string => typeof id === "string");

  if (!ids.length) {
    return [];
  }

  const astra = await getAstraClient();

  if (mode === "papers") {
    const rows = await astra
      .collection("hblocks_papers")
      .find({ paper_id: { $in: ids } })
      .toArray();

    return rows.map((row) => ({
      kind: "papers",
      id: row.paper_id,
      paperId: row.paper_id,
      title: row.title ?? row.paper_id,
      summary: row.summary,
      tag: "Paper",
    }));
  }

  if (mode === "sections") {
    const grouped = payloads.reduce<Record<string, string[]>>((acc, payload) => {
      if (typeof payload.paper_id !== "string" || typeof payload.section_id !== "string") {
        return acc;
      }
      acc[payload.paper_id] ??= [];
      acc[payload.paper_id].push(payload.section_id);
      return acc;
    }, {});

    const rows = (
      await Promise.all(
        Object.entries(grouped).map(([paperId, sectionIds]) =>
          astra
            .collection("hblocks_sections")
            .find({ paper_id: paperId, section_id: { $in: sectionIds } })
            .toArray(),
        ),
      )
    ).flat();

    return rows.map((row) => ({
      kind: "sections",
      id: row.section_id,
      paperId: row.paper_id,
      sectionId: row.section_id,
      title: row.section_title ?? row.section_id,
      summary: row.summary,
      tag: "Section",
    }));
  }

  if (mode === "blocks") {
    const grouped = payloads.reduce<Record<string, string[]>>((acc, payload) => {
      if (typeof payload.paper_id !== "string" || typeof payload.block_id !== "string") {
        return acc;
      }
      acc[payload.paper_id] ??= [];
      acc[payload.paper_id].push(payload.block_id);
      return acc;
    }, {});

    const rows = (
      await Promise.all(
        Object.entries(grouped).map(([paperId, blockIds]) =>
          astra
            .collection("hblocks_blocks")
            .find({ paper_id: paperId, block_id: { $in: blockIds } })
            .toArray(),
        ),
      )
    ).flat();

    return rows.map((row) => ({
      kind: "blocks",
      id: row.block_id,
      paperId: row.paper_id,
      sectionId: row.section_id,
      blockId: row.block_id,
      title: `Block ${row.block_index ?? ""}`.trim(),
      summary: row.text,
      tag: row.type ?? "Block",
    }));
  }

  const grouped = payloads.reduce<Record<string, string[]>>((acc, payload) => {
    if (
      typeof payload.paper_id !== "string" ||
      typeof payload.experiment_id !== "string"
    ) {
      return acc;
    }
    acc[payload.paper_id] ??= [];
    acc[payload.paper_id].push(payload.experiment_id);
    return acc;
  }, {});

  const rows = (
    await Promise.all(
      Object.entries(grouped).map(([paperId, experimentIds]) =>
        astra
          .collection("experiments")
          .find({ paper_id: paperId, experiment_id: { $in: experimentIds } })
          .toArray(),
      ),
    )
  ).flat();

  return rows.map((row) => ({
    kind: "experiments",
    id: row.experiment_id,
    paperId: row.paper_id,
    experimentId: row.experiment_id,
    title: row.title ?? row.experiment_id,
    summary: row.summary,
    tag: row.experiment_type ?? "Experiment",
  }));
}

export async function getExperimentByKey(paperId: string, experimentId: string) {
  if (!paperId || !experimentId) {
    return null;
  }

  const experiment = await (await getAstraClient())
    .collection("experiments")
    .findOne({ paper_id: paperId, experiment_id: experimentId });

  return experiment;
}

export async function getPaperById(paperId: string) {
  if (!paperId) {
    return null;
  }

  const paper = await (await getAstraClient())
    .collection("hblocks_papers")
    .findOne({ paper_id: paperId });

  return paper;
}

export async function getSectionById(paperId: string, sectionId: string) {
  if (!paperId || !sectionId) {
    return null;
  }

  const section = await (await getAstraClient())
    .collection("hblocks_sections")
    .findOne({ paper_id: paperId, section_id: sectionId });

  return section;
}

export async function getBlockById(paperId: string, blockId: string) {
  if (!paperId || !blockId) {
    return null;
  }

  const block = await (await getAstraClient())
    .collection("hblocks_blocks")
    .findOne({ paper_id: paperId, block_id: blockId });

  return block;
}

export async function getBlocksByIds(paperId: string, blockIds: string[]) {
  if (!paperId || blockIds.length === 0) {
    return [];
  }

  const blocks = await (await getAstraClient())
    .collection("hblocks_blocks")
    .find({ paper_id: paperId, block_id: { $in: blockIds } })
    .toArray();

  return blocks;
}
