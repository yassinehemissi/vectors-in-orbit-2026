import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AGENT_MODELS, DEFAULT_AGENT_MODEL } from "@/lib/agent-models";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { AgentConversation } from "@/models/AgentConversation";
import { AgentMessage } from "@/models/AgentMessage";
import { updateConversationSummary } from "@/ai/summary";
import { runAgent } from "@/ai/agent";

export async function GET() {
  return NextResponse.json({
    models: AGENT_MODELS,
    defaultModel: DEFAULT_AGENT_MODEL,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    message?: string;
    sessionId?: string;
    model?: string;
  };

  const message = payload.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const model = AGENT_MODELS.includes(payload.model ?? "")
    ? (payload.model as string)
    : DEFAULT_AGENT_MODEL;
  const sessionId = payload.sessionId ?? crypto.randomUUID();

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const conversation = await AgentConversation.findOneAndUpdate(
    { userId: user._id, sessionId },
    {
      $setOnInsert: {
        userId: user._id,
        sessionId,
        title: message.slice(0, 80),
      },
    },
    { new: true, upsert: true }
  );

  await AgentMessage.create({
    userId: user._id,
    conversationId: conversation._id,
    role: "user",
    content: message,
  });

  const recentMessages = await AgentMessage.find({
    conversationId: conversation._id,
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const result = await runAgent({
    userId: session.user.email,
    sessionId,
    message,
    model,
  });

  await AgentMessage.create({
    userId: user._id,
    conversationId: conversation._id,
    role: "assistant",
    content: result.reply?.trim() || "No response returned.",
    model,
  });

  const updatedSummary = updateConversationSummary({
    previousSummary: conversation.summary ?? "",
    userMessage: message,
    assistantMessage: result.reply ?? "",
  });

  conversation.summary = updatedSummary;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  return NextResponse.json({
    reply: result.reply ?? "",
    model,
    sessionId,
  });
}
