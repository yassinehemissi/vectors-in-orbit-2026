import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { listResearch } from "@/storage/research";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ collections: [] }, { status: 200 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ collections: [] }, { status: 200 });
  }

  const collections = await listResearch(user._id);

  return NextResponse.json(
    {
      collections: collections.map((collection) => ({
        id: collection._id.toString(),
        title: collection.title,
        description: collection.description ?? "",
        status: collection.status ?? "active",
      })),
    },
    { status: 200 }
  );
}
