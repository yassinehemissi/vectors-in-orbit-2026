import mongoose, { Schema } from "mongoose";

export type SearchHistoryResult = {
  kind: string;
  id: string;
  paperId?: string;
  sectionId?: string;
  blockId?: string;
};

export interface SearchHistoryDocument {
  userId: mongoose.Types.ObjectId;
  query: string;
  mode: string;
  filters: string[];
  sort: string;
  results: SearchHistoryResult[];
  resultCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const SearchHistorySchema = new Schema<SearchHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true },
    mode: { type: String, required: true },
    filters: { type: [String], default: [] },
    sort: { type: String, default: "Relevance" },
    results: {
      type: [
        {
          kind: { type: String, required: true },
          id: { type: String, required: true },
          paperId: { type: String },
          sectionId: { type: String },
          blockId: { type: String },
        },
      ],
      default: [],
    },
    resultCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ userId: 1, query: 1, mode: 1 });

export const SearchHistory =
  mongoose.models.SearchHistory ||
  mongoose.model("SearchHistory", SearchHistorySchema);
