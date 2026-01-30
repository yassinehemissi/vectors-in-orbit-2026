import mongoose, { Schema } from "mongoose";

export interface UserDocument {
  email: string;
  name?: string;
  image?: string;
  plan?: "free" | "pro" | "team";
  creditAccountId?: mongoose.Types.ObjectId;
  month_plan_accredated?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    image: { type: String },
    plan: { type: String, default: "free" },
    creditAccountId: { type: Schema.Types.ObjectId, ref: "CreditAccount" },
    month_plan_accredated: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
