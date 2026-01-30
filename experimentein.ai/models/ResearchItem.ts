import mongoose, { Schema } from "mongoose";

export type ResearchItemKind = "experiment" | "paper" | "section" | "block" | "item";

export interface ResearchItemDocument {
  researchId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kind: ResearchItemKind;
  paperId?: string;
  itemId: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ResearchItemSchema = new Schema<ResearchItemDocument>(
  {
    researchId: { type: Schema.Types.ObjectId, ref: "Research", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: {
      type: String,
      enum: ["experiment", "paper", "section", "block", "item"],
      required: true,
    },
    paperId: { type: String },
    itemId: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ResearchItemSchema.index(
  { researchId: 1, kind: 1, paperId: 1, itemId: 1 },
  { unique: true }
);

export const ResearchItem =
  mongoose.models.ResearchItem ||
  mongoose.model("ResearchItem", ResearchItemSchema);
