import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { AgentConversation } from "@/models/AgentConversation";
import { AgentMessage } from "@/models/AgentMessage";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const resolvedParams = await params;

  if (!mongoose.isValidObjectId(resolvedParams.conversationId)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const conversation = await AgentConversation.findOne({
    _id: resolvedParams.conversationId,
    userId: user._id,
  }).lean();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await AgentMessage.find({
    conversationId: conversation._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({
    conversation: {
      id: conversation._id.toString(),
      sessionId: conversation.sessionId,
      title: conversation.title ?? "Conversation",
      summary: conversation.summary ?? "",
    },
    messages: messages.map((message) => ({
      id: message._id.toString(),
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
  });
}
