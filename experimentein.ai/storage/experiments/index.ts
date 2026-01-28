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
  if (row?.title) return row.title as string;
  const parsed = parseExperimentJson(row?.experiment_json);
  return parsed?.title?.value ?? row?.experiment_id ?? "Experiment";
}

export function getExperimentSummary(row: Record<string, any>) {
  if (row?.summary) return row.summary as string;
  if (row?.description) return row.description as string;
  const parsed = parseExperimentJson(row?.experiment_json);
  return parsed?.description ?? undefined;
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

export async function listExperimentsByPaper(paperId: string) {
  if (!paperId) {
    return [];
  }

  const experiments = await (await getAstraClient())
    .collection("experiments")
    .find({ paper_id: paperId })
    .toArray();

  return experiments;
}

