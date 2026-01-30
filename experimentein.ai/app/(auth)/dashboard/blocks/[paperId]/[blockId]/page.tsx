import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { getBlockById } from "@/storage/blocks";
import { getPaperUploads } from "@/storage/papers-data";
import { EvidenceBlocksList, type EvidenceBlock } from "@/components/dashboard/evidence-blocks";
import Link from "next/link";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { logActivity } from "@/storage/activity";
import { PdfEvidenceTrigger } from "@/components/dashboard/pdf-evidence-trigger";
import type { Metadata } from "next";
import { getPaperById } from "@/storage/papers";

interface BlockPageProps {
  params: { paperId: string; blockId: string };
}

export default async function BlockPage({ params }: BlockPageProps) {
  const resolvedParams = await params;
  const block = await getBlockById(resolvedParams.paperId, resolvedParams.blockId);
  const uploads = block ? await getPaperUploads(block.paper_id) : { figures: [], tables: [] };
  const evidenceBlock: EvidenceBlock | null = block
    ? {
        block_id: block.block_id ?? resolvedParams.blockId,
        section_id: block.section_id,
        text: block.text,
        type: block.type,
        block_index: block.block_index,
        source: block.source,
        docling_ref: block.docling_ref,
      }
    : null;

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
            This block is not indexed yet or unavailable.
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
          title: "Viewed block",
          detail: block.type
            ? `${block.type} block${block.block_index !== undefined ? ` #${block.block_index}` : ""}`
            : "Block",
          type: "block_view",
          metadata: {
            paperId: block.paper_id,
            blockId: block.block_id,
            sectionId: block.section_id,
          },
        });
      }
    }
  } catch {
    // do not block page render on activity logging
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
            {block.type ? `${block.type} block` : "Block"}
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600">
            {block.text ?? "No text available for this block."}
          </p>
          {block.type === "figure" || block.type === "table" ? (
            <div className="mt-6">
              <EvidenceBlocksList
                blocks={evidenceBlock ? [evidenceBlock] : []}
                paperId={block.paper_id}
                uploads={uploads}
                showActions={false}
              />
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {block.section_id ? (
              <Link
                className="btn-secondary"
                href={`/dashboard/sections/${block.paper_id}/${block.section_id}`}
              >
                View section
              </Link>
            ) : null}
            <PdfEvidenceTrigger
              paperId={block.paper_id}
              doclingRef={block.docling_ref}
              label="View in PDF"
              highlightLabel={block.type ? `${block.type} block` : "Block"}
            />
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
              <ResearchSaveButton
                kind="block"
                itemId={block.block_id}
                paperId={block.paper_id}
              />
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

export async function generateMetadata({
  params,
}: {
  params: { paperId: string; blockId: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const block = await getBlockById(resolvedParams.paperId, resolvedParams.blockId);
  const paper = block ? await getPaperById(block.paper_id) : null;
  const title = block?.type ? `${block.type} block` : "Block";
  const paperTitle = paper?.title ? ` · ${paper.title}` : "";
  return {
    title: `Block: ${title}${paperTitle} · Experimentein.ai`,
    description: "Block content and evidence details.",
  };
}
