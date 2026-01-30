import { getAstraClient } from "@/storage/astra";

export function parseExperimentJson(raw?: unknown) {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
}

export function getExperimentTitle(row: Record<string, any>) {
  if (row?.label) return row.label as string;
  const parsed = parseExperimentJson(row?.item_json);
  return parsed?.label ?? row?.item_id ?? "Experiment";
}

export function getExperimentSummary(row: Record<string, any>) {
  if (row?.summary) return row.summary as string;
  const parsed = parseExperimentJson(row?.item_json);
  return parsed?.summary ?? undefined;
}

export async function getExperimentByKey(paperId: string, experimentId: string) {
  if (!paperId || !experimentId) {
    return null;
  }

  const experiment = await (await getAstraClient())
    .collection("items")
    .findOne({
      paper_id: paperId,
      item_id: experimentId,
      item_kind: "experiment",
    });

  return experiment;
}

export async function listExperimentsByPaper(paperId: string) {
  if (!paperId) {
    return [];
  }

  const experiments = await (await getAstraClient())
    .collection("items")
    .find({ paper_id: paperId, item_kind: "experiment" })
    .toArray();

  return experiments;
}

