"use server";

import { getAstraClient } from "./astra";
import { qdrantSearch } from "./qdrant";
import { embedText } from "./embeddings";

export async function searchExperiments(query: string) {
  if (!query.trim()) {
    return [];
  }

  const vector = await embedText(query);
  const results = await qdrantSearch({
    collection: "experiments",
    vector,
    limit: 8,
  });

  const ids = results
    .map((result) => result.payload?.experiment_id)
    .filter((id): id is string => typeof id === "string");

  if (!ids.length) {
    return [];
  }

  const experiments = await (await getAstraClient())
    .collection("experiments")
    .find({ experiment_id: { $in: ids } })
    .toArray();

  return experiments;
}

export async function getExperimentById(experimentId: string) {
  if (!experimentId) {
    return null;
  }

  const experiment = await (await getAstraClient())
    .collection("experiments")
    .findOne({ experiment_id: experimentId });

  return experiment;
}
