import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { getSearchHistoryResults } from "@/storage/search/history";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ historyId: string }> },
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const payload = await getSearchHistoryResults({
    userId: user._id,
    historyId: resolvedParams.historyId,
  });

  if (!payload) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  return NextResponse.json(payload, { status: 200 });
}
