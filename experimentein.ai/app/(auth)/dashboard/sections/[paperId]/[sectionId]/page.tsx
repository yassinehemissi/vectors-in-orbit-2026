import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { getSectionById } from "@/storage";
import Link from "next/link";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { logActivity } from "@/storage/activity";

interface SectionPageProps {
  params: { paperId: string; sectionId: string };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const resolvedParams = await params;
  const section = await getSectionById(
    resolvedParams.paperId,
    resolvedParams.sectionId,
  );

  if (!section) {
    return (
      <>
        <DashboardTopBar
          title="Section"
          subtitle="Canonical section record from Astra."
        />
        <div className="mt-6 rounded-3xl border border-dashed border-neutral-200/70 bg-white p-10 text-center shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Not found</p>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            Section unavailable
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            This section is not indexed yet or the ID does not exist.
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
          title: "Viewed section",
          detail: section.section_title ?? section.section_id ?? "Section",
          type: "section_view",
          metadata: { paperId: section.paper_id, sectionId: section.section_id },
        });
      }
    }
  } catch {
    // do not block page render on activity logging
  }

  return (
    <>
      <DashboardTopBar
        title="Section"
        subtitle="Canonical section record from Astra."
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Summary</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
            {section.section_title ?? section.section_id ?? "Section"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            {section.summary ?? "No summary available yet."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="btn-secondary"
              href={`/dashboard/papers/${section.paper_id}`}
            >
              View paper
            </Link>
            <Link className="btn-secondary" href="/dashboard/search">
              Search related content
            </Link>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Metadata</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between gap-3">
                <span>Section ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {section.section_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Paper ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {section.paper_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Summary chars</span>
                <span>{section.summary_chars ?? "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Blocks indexed</span>
                <span>{section.source_block_count ?? "N/A"}</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <ResearchSaveButton
                kind="section"
                itemId={section.section_id}
                paperId={section.paper_id}
              />
              <Link className="btn-primary" href="/dashboard/experiments">
                Explore experiments
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
