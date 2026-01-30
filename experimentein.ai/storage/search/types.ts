export type SearchMode =
  | "papers"
  | "sections"
  | "blocks"
  | "items"
  | "experiments";

export type NormalizedSearchResult = {
  kind: SearchMode;
  id: string;
  title: string;
  summary?: string;
  paperId?: string;
  sectionId?: string;
  blockId?: string;
  experimentId?: string;
  tag?: string;
};

export type QdrantPayload = Record<string, unknown>;

