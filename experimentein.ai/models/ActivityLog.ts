import mongoose, { Schema } from "mongoose";

export interface ActivityLogDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  detail?: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    detail: { type: String },
    type: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
