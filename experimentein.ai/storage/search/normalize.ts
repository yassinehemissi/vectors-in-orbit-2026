import type { NormalizedSearchResult, QdrantPayload, SearchMode } from "./types";
import { getExperimentSummary, getExperimentTitle } from "@/storage/experiments";
import { getItemSummary, getItemTitle } from "@/storage/items";

export function normalizePapers(rows: Array<Record<string, any>>) {
  return rows.map((row) => ({
    kind: "papers" as const,
    id: row.paper_id,
    paperId: row.paper_id,
    title: row.title ?? row.paper_id,
    summary: row.summary,
    tag: "Paper",
  }));
}

export function normalizeSections(rows: Array<Record<string, any>>) {
  return rows.map((row) => ({
    kind: "sections" as const,
    id: row.section_id,
    paperId: row.paper_id,
    sectionId: row.section_id,
    title: row.title ?? row.section_id,
    summary: row.summary,
    tag: "Section",
  }));
}

export function normalizeBlocks(rows: Array<Record<string, any>>) {
  return rows.map((row) => ({
    kind: "blocks" as const,
    id: row.block_id,
    paperId: row.paper_id,
    sectionId: row.section_id,
    blockId: row.block_id,
    title: `Block ${row.block_index ?? ""}`.trim(),
    summary: row.text,
    tag: row.type ?? "Block",
  }));
}

export function normalizeExperiments(rows: Array<Record<string, any>>) {
  return rows
    .filter((row) => row.item_kind === "experiment")
    .map((row) => ({
      kind: "experiments" as const,
      id: row.item_id,
      paperId: row.paper_id,
      experimentId: row.item_id,
      title: getExperimentTitle(row),
      summary: getExperimentSummary(row),
      tag: "Experiment",
    }));
}

export function normalizeItems(rows: Array<Record<string, any>>) {
  return rows.map((row) => ({
    kind: "items" as const,
    id: row.item_id,
    paperId: row.paper_id,
    title: getItemTitle(row),
    summary: getItemSummary(row),
    tag: row.item_kind ?? "Item",
  }));
}

export function extractIds(payloads: QdrantPayload[], key: string) {
  return payloads
    .map((payload) => payload[key])
    .filter((id): id is string => typeof id === "string");
}

export function groupIds(
  payloads: QdrantPayload[],
  paperKey: string,
  idKey: string
) {
  return payloads.reduce<Record<string, string[]>>((acc, payload) => {
    const paperId = payload[paperKey];
    const itemId = payload[idKey];
    if (typeof paperId !== "string" || typeof itemId !== "string") {
      return acc;
    }
    acc[paperId] ??= [];
    acc[paperId].push(itemId);
    return acc;
  }, {});
}

