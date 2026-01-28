"use server"

import { getAstraClient } from "@/storage/astra";

export async function getSectionById(paperId: string, sectionId: string) {
  if (!paperId || !sectionId) {
    return null;
  }

  const section = await (await getAstraClient())
    .collection("hblocks_sections")
    .findOne({ paper_id: paperId, section_id: sectionId });

  return section;
}

