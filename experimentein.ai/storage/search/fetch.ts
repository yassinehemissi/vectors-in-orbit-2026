import { getAstraClient } from "@/storage/astra";
import type { QdrantPayload, SearchMode } from "./types";
import { extractIds, groupIds } from "./normalize";

const modeMap: Record<SearchMode, { collection: string; idKey: string }> = {
  papers: { collection: "hblocks_papers", idKey: "paper_id" },
  sections: { collection: "hblocks_sections", idKey: "section_id" },
  blocks: { collection: "hblocks_blocks", idKey: "block_id" },
  experiments: { collection: "experiments", idKey: "experiment_id" },
};

export function getModeConfig(mode: SearchMode) {
  return modeMap[mode];
}

export async function fetchByMode(
  mode: SearchMode,
  payloads: QdrantPayload[]
) {
  const astra = await getAstraClient();
  const { idKey } = modeMap[mode];

  if (mode === "papers") {
    const ids = extractIds(payloads, idKey);
    if (!ids.length) return [];
    return astra
      .collection("hblocks_papers")
      .find({ paper_id: { $in: ids } })
      .toArray();
  }

  if (mode === "sections") {
    const grouped = groupIds(payloads, "paper_id", "section_id");
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
    return rows;
  }

  if (mode === "blocks") {
    const grouped = groupIds(payloads, "paper_id", "block_id");
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
    return rows;
  }

  const grouped = groupIds(payloads, "paper_id", "experiment_id");
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
  return rows;
}

