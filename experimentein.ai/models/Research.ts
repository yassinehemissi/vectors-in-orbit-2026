import mongoose, { Schema } from "mongoose";

export interface ResearchDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status?: "active" | "archived";
  createdAt?: Date;
  updatedAt?: Date;
}

const ResearchSchema = new Schema<ResearchDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

ResearchSchema.index({ userId: 1, title: 1 }, { unique: true });

export const Research =
  mongoose.models.Research || mongoose.model("Research", ResearchSchema);
