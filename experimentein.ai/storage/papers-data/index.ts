"use server";

import { getAstraClient } from "@/storage/astra";

export type PaperUpload = {
  path: string;
  url: string;
};

export async function getPaperUploads(paperId: string) {
  if (!paperId) {
    return { figures: [] as PaperUpload[], tables: [] as PaperUpload[] };
  }

  const row = await (await getAstraClient())
    .collection("papers_data")
    .findOne({ paper_hash: paperId });

  if (!row?.paper_json || typeof row.paper_json !== "string") {
    return { figures: [] as PaperUpload[], tables: [] as PaperUpload[] };
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(row.paper_json);
  } catch {
    return { figures: [] as PaperUpload[], tables: [] as PaperUpload[] };
  }

  const uploads = Array.isArray(parsed?.uploads) ? parsed.uploads : [];
  const figures: PaperUpload[] = [];
  const tables: PaperUpload[] = [];

  uploads.forEach((upload: any) => {
    if (!upload?.path || !upload?.url) return;
    const entry = { path: String(upload.path), url: String(upload.url) };
    if (entry.path.includes("figure_")) {
      figures.push(entry);
    } else if (entry.path.includes("table_")) {
      tables.push(entry);
    }
  });

  return { figures, tables };
}

export async function getPaperStructureWithOffsets(paperId: string) {
  if (!paperId) return null;

  const row = await (await getAstraClient())
    .collection("papers_data")
    .findOne({ paper_hash: paperId });

  if (!row?.paper_json || typeof row.paper_json !== "string") {
    return null;
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(row.paper_json);
  } catch {
    return null;
  }

  const uploads = Array.isArray(parsed?.uploads) ? parsed.uploads : [];
  const structureUpload = uploads.find((upload: any) => {
    const path = String(upload?.path ?? "");
    return (
      path.includes("structure_with_offset") ||
      path.includes("structure_with_offsets")
    );
  });

  if (!structureUpload?.url) return null;

  try {
    const response = await fetch(String(structureUpload.url));
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getPaperPdfUrl(paperId: string) {
  if (!paperId) return null;

  const row = await (await getAstraClient())
    .collection("papers_data")
    .findOne({ paper_hash: paperId });

  if (!row?.paper_json || typeof row.paper_json !== "string") {
    return null;
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(row.paper_json);
  } catch {
    return null;
  }

  const uploads = Array.isArray(parsed?.uploads) ? parsed.uploads : [];
  const pdfUpload = uploads.find((upload: any) => {
    const path = String(upload?.path ?? "");
    return path.endsWith("original.pdf") || path.endsWith(".pdf");
  });

  return pdfUpload?.url ? String(pdfUpload.url) : null;
}
