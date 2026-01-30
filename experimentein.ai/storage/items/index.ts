import { getAstraClient } from "@/storage/astra";

export type ItemKind =
  | "experiment"
  | "method"
  | "claim"
  | "dataset"
  | "resource"
  | "negative_result";

export function parseItemJson(raw?: unknown) {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
}

export function getItemTitle(row: Record<string, any>) {
  if (row?.label) return row.label as string;
  const parsed = parseItemJson(row?.item_json);
  return parsed?.label ?? "Item";
}

export function getItemSummary(row: Record<string, any>) {
  if (row?.summary) return row.summary as string;
  const parsed = parseItemJson(row?.item_json);
  return parsed?.summary ?? undefined;
}

export async function getItemByKey(paperId: string, itemId: string) {
  if (!paperId || !itemId) {
    return null;
  }

  const item = await (await getAstraClient())
    .collection("items")
    .findOne({ paper_id: paperId, item_id: itemId });

  return item;
}

export async function listItemsByPaper(paperId: string, kind?: ItemKind) {
  if (!paperId) {
    return [];
  }

  const query: Record<string, any> = { paper_id: paperId };
  if (kind) {
    query.item_kind = kind;
  }

  const items = await (await getAstraClient())
    .collection("items")
    .find(query)
    .toArray();

  return items;
}
