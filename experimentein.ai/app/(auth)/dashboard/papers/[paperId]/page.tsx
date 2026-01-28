import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { getPaperById } from "@/storage/papers";
import Link from "next/link";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { logActivity } from "@/storage/activity";

interface PaperPageProps {
  params: { paperId: string };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const resolvedParams = await params;
  const paper = await getPaperById(resolvedParams.paperId);

  if (!paper) {
    return (
      <>
        <DashboardTopBar
          title="Paper"
          subtitle="Canonical paper record from Astra."
        />
        <div className="mt-6 rounded-3xl border border-dashed border-neutral-200/70 bg-white p-10 text-center shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Not found</p>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            Paper unavailable
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            This record is not indexed yet or the ID does not exist.
          </p>
          <Link className="btn-secondary mt-6" href="/dashboard/search">
            Back to search
          </Link>
        </div>
      </>
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (email) {
      await connectToDatabase();
      const user = await User.findOne({ email });
      if (user) {
        await logActivity({
          userId: user._id,
          title: "Viewed paper",
          detail: paper.title ?? paper.paper_id ?? "Paper",
          type: "paper_view",
          metadata: { paperId: paper.paper_id },
        });
      }
    }
  } catch {
    // do not block page render on activity logging
  }

  return (
    <>
      <DashboardTopBar
        title="Paper"
        subtitle="Canonical paper record from Astra."
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Summary</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
            {paper.title ?? paper.paper_id ?? "Paper"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            {paper.summary ?? "No summary available yet."}
          </p>
          {paper.paper_url ? (
            <a
              className="btn-secondary mt-6 inline-flex"
              href={paper.paper_url}
              target="_blank"
              rel="noreferrer"
            >
              Open source
            </a>
          ) : null}
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Metadata</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between gap-3">
                <span>Paper ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {paper.paper_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Summary chars</span>
                <span>{paper.summary_chars ?? "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Sections indexed</span>
                <span>{paper.source_section_count ?? "N/A"}</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <ResearchSaveButton kind="paper" itemId={paper.paper_id} />
              <Link className="btn-secondary" href="/dashboard/search">
                Search related content
              </Link>
              <Link
                className="btn-primary"
                href={`/dashboard/papers/${paper.paper_id}/experiments`}
              >
                Related experiments
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
