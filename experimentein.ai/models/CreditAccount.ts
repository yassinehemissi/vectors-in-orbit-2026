import mongoose, { Schema } from "mongoose";

export interface CreditAccountDocument {
  userId: mongoose.Types.ObjectId;
  balance: number;
  reserved: number;
  month_plan_accredated?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const CreditAccountSchema = new Schema<CreditAccountDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    month_plan_accredated: { type: Date, default: null },
  },
  { timestamps: true }
);

export const CreditAccount =
  mongoose.models.CreditAccount ||
  mongoose.model("CreditAccount", CreditAccountSchema);
