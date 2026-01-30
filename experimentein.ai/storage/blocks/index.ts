"use server"

import { getAstraClient } from "@/storage/astra";

export async function getBlockById(paperId: string, blockId: string) {
  if (!paperId || !blockId) {
    return null;
  }

  const block = await (await getAstraClient())
    .collection("blocks")
    .findOne({ paper_id: paperId, block_id: blockId });

  return block;
}

export async function getBlocksByIds(paperId: string, blockIds: string[]) {
  if (!paperId || blockIds.length === 0) {
    return [];
  }

  const blocks = await (await getAstraClient())
    .collection("blocks")
    .find({ paper_id: paperId, block_id: { $in: blockIds } })
    .toArray();

  return blocks;
}

