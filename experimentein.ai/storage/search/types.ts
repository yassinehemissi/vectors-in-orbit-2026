export type SearchMode =
  | "papers"
  | "sections"
  | "blocks"
  | "items"
  | "experiments";

export type NormalizedSearchResult = {
  kind: SearchMode;
  id: string;
  title?: string;
  summary?: string;
  paperId?: string;
  sectionId?: string;
  section_title?: string;
  blockId?: string;
  experimentId?: string;
  tag?: string;
  confidence?: number;
  evidenceCount?: number;
  missingFields?: boolean;
};

export type QdrantPayload = Record<string, unknown>;

