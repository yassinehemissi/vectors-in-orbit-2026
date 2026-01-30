import mongoose, { Schema } from "mongoose";

export interface AgentConversationDocument {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  title?: string;
  summary?: string;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AgentConversationSchema = new Schema<AgentConversationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true },
    title: { type: String },
    summary: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

AgentConversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export const AgentConversation =
  mongoose.models.AgentConversation ||
  mongoose.model("AgentConversation", AgentConversationSchema);
