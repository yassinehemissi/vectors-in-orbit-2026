import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import { getItemByKey, getItemSummary, getItemTitle, parseItemJson } from "@/storage/items";
import { getBlocksByIds } from "@/storage/blocks";
import Link from "next/link";

export default async function ItemDetailPage({
  params,
}: {
  params: { paperId: string; itemId: string };
}) {
  const resolvedParams = await params;
  const item = await getItemByKey(resolvedParams.paperId, resolvedParams.itemId);

  if (!item) {
    return (
      <>
        <DashboardTopBar title="Item" subtitle="Item details and evidence." />
        <div className="mt-6 rounded-3xl border border-dashed border-neutral-200/70 bg-white p-10 text-center shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Not found</p>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            Item unavailable
          </h2>
          <Link className="btn-secondary mt-6" href="/dashboard/items">
            Back to items
          </Link>
        </div>
      </>
    );
  }

  const itemJson = parseItemJson(item.item_json);
  const sourceBlocks = Array.isArray(itemJson?.source_block_ids)
    ? (itemJson?.source_block_ids as string[])
    : [];
  const blocks = sourceBlocks.length
    ? await getBlocksByIds(item.paper_id, sourceBlocks)
    : [];

  return (
    <>
      <DashboardTopBar title="Item" subtitle="Item details and evidence." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Item</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
              {getItemTitle(item)}
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              {getItemSummary(item) ?? "No summary available yet."}
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Evidence blocks</p>
            {blocks.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No source blocks listed.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {blocks.map((block) => (
                  <div
                    key={block.block_id}
                    className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{block.type ?? "Block"}</span>
                      <span>#{block.block_index ?? "N/A"}</span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-700">
                      {block.text ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Metadata</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between gap-3">
                <span>Kind</span>
                <span>{item.item_kind ?? "item"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Confidence</span>
                <span>
                  {typeof item.confidence_overall === "number"
                    ? item.confidence_overall.toFixed(2)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <ResearchSaveButton
                kind="item"
                itemId={item.item_id}
                paperId={item.paper_id}
              />
              <Link
                className="btn-secondary"
                href={`/dashboard/papers/${item.paper_id}`}
              >
                View paper
              </Link>
              <Link className="btn-secondary" href="/dashboard/items">
                Back to items
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
