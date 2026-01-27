import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { getBlockById } from "@/storage/actions";
import Link from "next/link";

interface BlockPageProps {
  params: { paperId: string; blockId: string };
}

export default async function BlockPage({ params }: BlockPageProps) {
  const resolvedParams = await params;
  const block = await getBlockById(resolvedParams.paperId, resolvedParams.blockId);

  if (!block) {
    return (
      <>
        <DashboardTopBar
          title="Block"
          subtitle="Canonical block record from Astra."
        />
        <div className="mt-6 rounded-3xl border border-dashed border-neutral-200/70 bg-white p-10 text-center shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Not found</p>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            Block unavailable
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            This block is not indexed yet or the ID does not exist.
          </p>
          <Link className="btn-secondary mt-6" href="/dashboard/search">
            Back to search
          </Link>
        </div>
      </>
    );
  }

  const sectionPath =
    Array.isArray(block.section_path) && block.section_path.length > 0
      ? block.section_path.join(" / ")
      : "N/A";

  return (
    <>
      <DashboardTopBar
        title="Block"
        subtitle="Canonical block record from Astra."
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Content</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
            {block.block_id ?? "Block"}
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600">
            {block.text ?? "No text available for this block."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {block.section_id ? (
              <Link
                className="btn-secondary"
                href={`/dashboard/sections/${block.paper_id}/${block.section_id}`}
              >
                View section
              </Link>
            ) : null}
            <Link
              className="btn-secondary"
              href={`/dashboard/papers/${block.paper_id}`}
            >
              View paper
            </Link>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Metadata</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between gap-3">
                <span>Block ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {block.block_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Paper ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {block.paper_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Section ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {block.section_id ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Type</span>
                <span>{block.type ?? "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Block index</span>
                <span>{block.block_index ?? "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Section index</span>
                <span>{block.section_index ?? "N/A"}</span>
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase text-neutral-400">
                  Section path
                </span>
                <p className="text-sm text-neutral-600">{sectionPath}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link className="btn-secondary" href="/dashboard/search">
                Search related content
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
