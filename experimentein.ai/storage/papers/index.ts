"use server"

import { getAstraClient } from "@/storage/astra";

export async function getPaperById(paperId: string) {
  if (!paperId) {
    return null;
  }

  const paper = await (await getAstraClient())
    .collection("hblocks_papers")
    .findOne({ paper_id: paperId });

  return paper;
}

