import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { listResearch } from "@/storage/research";
import Link from "next/link";
import { ResearchCreateButton } from "@/components/dashboard/research-create";

export default async function DashboardResearchPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <>
        <DashboardTopBar
          title="Research"
          subtitle="Your research collections and saved items."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Sign in to manage research collections.
        </div>
      </>
    );
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  const collections = user ? await listResearch(user._id) : [];

  return (
    <>
      <DashboardTopBar
        title="Research"
        subtitle="Your research collections and saved items."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-neutral-400">Research</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
              Collections
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Group saved content into research collections.
            </p>
          </div>
          <ResearchCreateButton />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {collections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              No research collections yet. Create one to start saving.
            </div>
          ) : null}
          {collections.map((collection) => (
            <div
              key={collection._id.toString()}
              className="rounded-3xl border border-neutral-200/70 bg-neutral-50 p-6"
            >
              <p className="text-xs uppercase text-neutral-400">Collection</p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                {collection.title}
              </h3>
              {collection.description ? (
                <p className="mt-2 text-xs text-neutral-500">
                  {collection.description}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-neutral-500">
                Status: {collection.status ?? "active"}
              </p>
              <Link
                className="btn-secondary mt-4 inline-flex"
                href={`/dashboard/research/${collection._id.toString()}`}
              >
                Open collection
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
