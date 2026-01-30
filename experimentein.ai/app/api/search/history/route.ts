import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { listSearchHistory, saveSearchHistory } from "@/storage/search/history";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ history: [] }, { status: 200 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ history: [] }, { status: 200 });
  }

  const history = await listSearchHistory(user._id);
  return NextResponse.json({ history }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const body = (await request.json()) as {
    query?: string;
    mode?: string;
    filters?: string[];
    sort?: string;
    results?: Array<{
      kind: string;
      id: string;
      paperId?: string;
      sectionId?: string;
      blockId?: string;
    }>;
  };

  if (!body.query || !body.mode || !Array.isArray(body.results)) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  await saveSearchHistory({
    userId: user._id,
    query: body.query,
    mode: body.mode,
    filters: Array.isArray(body.filters) ? body.filters : [],
    sort: body.sort ?? "Relevance",
    results: body.results,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
