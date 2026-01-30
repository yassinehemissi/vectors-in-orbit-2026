import mongoose, { Schema } from "mongoose";

export interface AgentMessageDocument {
  userId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  model?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AgentMessageSchema = new Schema<AgentMessageDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "AgentConversation",
      required: true,
    },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    model: { type: String },
  },
  { timestamps: true }
);

AgentMessageSchema.index({ conversationId: 1, createdAt: -1 });

export const AgentMessage =
  mongoose.models.AgentMessage || mongoose.model("AgentMessage", AgentMessageSchema);
