import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { AgentConversation } from "@/models/AgentConversation";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const searchRegex = query
    ? new RegExp(query.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i")
    : null;
  const filter = searchRegex
    ? {
        userId: user._id,
        $or: [{ title: searchRegex }, { summary: searchRegex }],
      }
    : { userId: user._id };

  const conversations = await AgentConversation.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(50)
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
