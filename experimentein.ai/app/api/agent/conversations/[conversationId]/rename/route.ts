import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { AgentConversation } from "@/models/AgentConversation";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  if (!mongoose.isValidObjectId(resolvedParams.conversationId)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const payload = (await request.json()) as { title?: string };
  const title = payload.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const conversation = await AgentConversation.findOneAndUpdate(
    { _id: resolvedParams.conversationId, userId: user._id },
    { title },
    { new: true }
  ).lean();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    conversation: {
      id: conversation._id.toString(),
      sessionId: conversation.sessionId,
      title: conversation.title ?? "Conversation",
      summary: conversation.summary ?? "",
    },
  });
}
