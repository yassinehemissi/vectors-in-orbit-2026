import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { getAstraClient } from "@/storage/astra";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ titles: {} }, { status: 200 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ titles: {} }, { status: 200 });
  }

  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);

  if (!ids.length) {
    return NextResponse.json({ titles: {} }, { status: 200 });
  }

  const astra = await getAstraClient();
  const rows = await astra
    .collection("papers")
    .find({ paper_id: { $in: ids } })
    .toArray();

  const titles = rows.reduce<Record<string, string>>((acc, row) => {
    if (row.paper_id) {
      acc[row.paper_id] = row.title ?? "Untitled paper";
    }
    return acc;
  }, {});

  return NextResponse.json({ titles }, { status: 200 });
}
