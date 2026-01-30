"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { SearchHistory, type SearchHistoryResult } from "@/models/SearchHistory";
import { getAstraClient } from "@/storage/astra";
import {
  normalizeBlocks,
  normalizeItems,
  normalizePapers,
  normalizeSections,
} from "@/storage/search/normalize";
import type { NormalizedSearchResult } from "@/storage/search/types";

const MAX_HISTORY = 10;

export async function saveSearchHistory({
  userId,
  query,
  mode,
  filters,
  sort,
  results,
}: {
  userId: mongoose.Types.ObjectId;
  query: string;
  mode: string;
  filters: string[];
  sort: string;
  results: SearchHistoryResult[];
}) {
  await connectToDatabase();

  const resultCount = results.length;
  const existing = await SearchHistory.findOne({
    userId,
    query,
    mode,
    filters,
    sort,
  });

  if (existing) {
    existing.results = results;
    existing.resultCount = resultCount;
    existing.updatedAt = new Date();
    await existing.save();
  } else {
    await SearchHistory.create({
      userId,
      query,
      mode,
      filters,
      sort,
      results,
      resultCount,
    });
  }

  const history = await SearchHistory.find({ userId })
    .sort({ createdAt: -1 })
    .select({ _id: 1 })
    .lean();

  if (history.length > MAX_HISTORY) {
    const idsToDelete = history.slice(MAX_HISTORY).map((entry) => entry._id);
    await SearchHistory.deleteMany({ _id: { $in: idsToDelete } });
  }
}

export async function listSearchHistory(userId: mongoose.Types.ObjectId) {
  await connectToDatabase();
  return SearchHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY)
    .lean();
}

export async function getSearchHistoryResults({
  userId,
  historyId,
}: {
  userId: mongoose.Types.ObjectId;
  historyId: string;
}) {
  await connectToDatabase();
  const history = await SearchHistory.findOne({
    _id: historyId,
    userId,
  }).lean();

  if (!history) {
    return null;
  }

  const results = history.results ?? [];
  const astra = await getAstraClient();

  const paperIds = results
    .filter((item) => item.kind === "papers" && item.paperId)
    .map((item) => item.paperId as string);

  const sectionGroups = groupByPaper(
    results.filter((item) => item.kind === "sections" && item.paperId),
  );
  const blockGroups = groupByPaper(
    results.filter((item) => item.kind === "blocks" && item.paperId),
  );
  const itemGroups = groupByPaper(
    results.filter((item) => item.kind === "items" && item.paperId),
  );

  const papers = paperIds.length
    ? await astra.collection("papers").find({ paper_id: { $in: paperIds } }).toArray()
    : [];

  const sections = await fetchByPaperGroups(
    astra,
    "sections",
    sectionGroups,
    "section_id",
  );
  const blocks = await fetchByPaperGroups(
    astra,
    "blocks",
    blockGroups,
    "block_id",
  );
  const items = await fetchByPaperGroups(
    astra,
    "items",
    itemGroups,
    "item_id",
  );

  const normalized: NormalizedSearchResult[] = [
    ...normalizePapers(papers),
    ...normalizeSections(sections),
    ...normalizeBlocks(blocks),
    ...normalizeItems(items),
  ];

  return {
    history,
    results: normalized,
  };
}

function groupByPaper(entries: SearchHistoryResult[]) {
  return entries.reduce<Record<string, string[]>>((acc, entry) => {
    if (!entry.paperId) return acc;
    acc[entry.paperId] ??= [];
    acc[entry.paperId].push(entry.id);
    return acc;
  }, {});
}

async function fetchByPaperGroups(
  astra: any,
  collection: string,
  groups: Record<string, string[]>,
  idKey: string,
) {
  const rows: Record<string, any>[] = [];
  const paperIds = Object.keys(groups);
  for (const paperId of paperIds) {
    const ids = groups[paperId] ?? [];
    if (!ids.length) continue;
    const result = await astra
      .collection(collection)
      .find({ paper_id: paperId, [idKey]: { $in: ids } })
      .toArray();
    rows.push(...result);
  }
  return rows;
}
