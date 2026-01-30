import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { AgentConversation } from "@/models/AgentConversation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const conversations = await AgentConversation.find({ userId: user._id })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({
    conversations: conversations.map((conversation) => ({
      id: conversation._id.toString(),
      sessionId: conversation.sessionId,
      title: conversation.title ?? "Conversation",
      summary: conversation.summary ?? "",
      lastMessageAt: conversation.lastMessageAt ?? conversation.updatedAt,
    })),
  });
}
