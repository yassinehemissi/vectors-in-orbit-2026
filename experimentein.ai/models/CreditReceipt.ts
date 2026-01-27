import mongoose, { Schema } from "mongoose";

export interface CreditReceiptDocument {
  userId: mongoose.Types.ObjectId;
  creditAccountId: mongoose.Types.ObjectId;
  requestId: string;
  actionType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CreditReceiptSchema = new Schema<CreditReceiptDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creditAccountId: {
      type: Schema.Types.ObjectId,
      ref: "CreditAccount",
      required: true,
    },
    requestId: { type: String, required: true },
    actionType: { type: String, required: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    creditsCharged: { type: Number, required: true },
  },
  { timestamps: true }
);

export const CreditReceipt =
  mongoose.models.CreditReceipt ||
  mongoose.model("CreditReceipt", CreditReceiptSchema);
