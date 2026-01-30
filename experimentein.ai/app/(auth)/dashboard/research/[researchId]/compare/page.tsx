import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { ResearchItem } from "@/models/ResearchItem";
import mongoose from "mongoose";
import Link from "next/link";
import { getItemByKey, getItemSummary, getItemTitle, parseItemJson } from "@/storage/items";
import { getPaperById } from "@/storage/papers";
import { logActivity } from "@/storage/activity";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Items · Experimentein.ai",
  description: "Side-by-side comparison of saved items.",
};

type CompareEntry = {
  id: string;
  itemId: string;
  title: string;
  summary: string;
  kind: string;
  confidence?: number;
  evidenceCount?: number;
  paperTitle?: string;
  paperId?: string;
};

const kindLabel = (kind?: string) => {
  if (!kind) return "Item";
  if (kind === "experiment") return "Study";
  return kind.replace(/_/g, " ");
};

export default async function ResearchComparePage({
  params,
  searchParams,
}: {
  params: { researchId: string };
  searchParams?: { ids?: string };
}) {
  const resolvedParams = await params;
  searchParams = await searchParams;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <>
        <DashboardTopBar
          title="Compare items"
          subtitle="Sign in to compare saved items."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Sign in to compare items.
        </div>
      </>
    );
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    return (
      <>
        <DashboardTopBar
          title="Compare items"
          subtitle="Compare items saved in this research collection."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          User not found.
        </div>
      </>
    );
  }

  const idsParam = searchParams?.ids ?? "";
  const rawIds = idsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (rawIds.length < 2) {
    return (
      <>
        <DashboardTopBar
          title="Compare items"
          subtitle="Select at least two items to compare."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Pick two or more items in the research collection to compare them.
        </div>
        <Link
          className="btn-secondary mt-4 inline-flex"
          href={`/dashboard/research/${resolvedParams.researchId}`}
        >
          Back to collection
        </Link>
      </>
    );
  }

  const objectIds = rawIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const researchItems = await ResearchItem.find({
    _id: { $in: objectIds },
    userId: user._id,
    researchId: new mongoose.Types.ObjectId(resolvedParams.researchId),
  }).lean();

  const compareItems = researchItems.filter(
    (item) => item.kind === "item" || item.kind === "experiment",
  );

  const compareEntries: CompareEntry[] = [];

  for (const item of compareItems) {
    if (!item.paperId) continue;
    const row = await getItemByKey(item.paperId, item.itemId);
    if (!row) {
      compareEntries.push({
        id: item._id.toString(),
        itemId: item.itemId,
        title: "Item not indexed yet",
        summary: "This item was not found in the current index.",
        kind: kindLabel(item.kind),
        paperId: item.paperId,
      });
      continue;
    }

    const parsed = parseItemJson(row.item_json);
    const evidenceCount = Array.isArray(parsed?.source_block_ids)
      ? parsed?.source_block_ids.length
      : 0;
    const confidence =
      typeof row.confidence_overall === "number"
        ? row.confidence_overall
        : typeof parsed?.confidence_overall === "number"
          ? parsed.confidence_overall
          : undefined;

    const paper = await getPaperById(item.paperId);
    compareEntries.push({
      id: item._id.toString(),
      itemId: item.itemId,
      title: getItemTitle(row),
      summary: getItemSummary(row) ?? "No summary available.",
      kind: kindLabel(row.item_kind ?? item.kind),
      confidence,
      evidenceCount,
      paperTitle: paper?.title ?? "Untitled paper",
      paperId: item.paperId,
    });
  }

  try {
    await logActivity({
      userId: user._id,
      title: "Compared items",
      detail: `${compareEntries.length} items`,
      type: "compare_items",
      metadata: { researchId: resolvedParams.researchId },
    });
  } catch {
    // ignore activity logging errors
  }

  if (compareEntries.length < 2) {
    return (
      <>
        <DashboardTopBar
          title="Compare items"
          subtitle="Select at least two items to compare."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          We could not load enough items to compare.
        </div>
        <Link
          className="btn-secondary mt-4 inline-flex"
          href={`/dashboard/research/${resolvedParams.researchId}`}
        >
          Back to collection
        </Link>
      </>
    );
  }

  return (
    <>
      <DashboardTopBar
        title="Compare items"
        subtitle="Side-by-side view of selected items."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-neutral-400">Compare</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
              {compareEntries.length} items
            </h2>
          </div>
          <Link
            className="btn-secondary text-xs"
            href={`/dashboard/research/${resolvedParams.researchId}`}
          >
            Back to collection
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[220px_repeat(auto-fit,minmax(240px,1fr))]">
          <div className="space-y-4 text-xs text-neutral-500">
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
              Title
            </div>
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
              Summary
            </div>
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
              Kind
            </div>
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
              Confidence
            </div>
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
              Evidence blocks
            </div>
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
              Paper
            </div>
          </div>

          {compareEntries.map((entry) => (
            <div key={entry.id} className="space-y-4">
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-3">
                <p className="text-sm font-semibold text-neutral-900">
                  {entry.title}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-3 text-sm text-neutral-600">
                {entry.summary}
              </div>
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-3 text-sm text-neutral-600">
                {entry.kind}
              </div>
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-3 text-sm text-neutral-600">
                {typeof entry.confidence === "number"
                  ? entry.confidence.toFixed(2)
                  : "N/A"}
              </div>
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-3 text-sm text-neutral-600">
                {entry.evidenceCount ?? 0}
              </div>
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-3 text-sm text-neutral-600">
                {entry.paperTitle ?? "Untitled paper"}
              </div>
              {entry.paperId && entry.itemId ? (
                <Link
                  className="btn-secondary w-full"
                  href={`/dashboard/items/${entry.paperId}/${entry.itemId}`}
                >
                  Open item
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
