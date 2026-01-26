import mongoose, { Schema } from "mongoose";

export interface UserDocument {
  email: string;
  name?: string;
  image?: string;
  plan?: "free" | "pro" | "team";
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    image: { type: String },
    plan: { type: String, default: "free" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
