import mongoose, { Schema } from "mongoose";

export interface CreditLogDocument {
  userId: mongoose.Types.ObjectId;
  creditAccountId: mongoose.Types.ObjectId;
  delta: number;
  reason: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const CreditLogSchema = new Schema<CreditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creditAccountId: {
      type: Schema.Types.ObjectId,
      ref: "CreditAccount",
      required: true,
    },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
    requestId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const CreditLog =
  mongoose.models.CreditLog || mongoose.model("CreditLog", CreditLogSchema);
