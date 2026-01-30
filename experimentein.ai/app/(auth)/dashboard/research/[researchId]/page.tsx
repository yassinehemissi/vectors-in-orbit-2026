import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { listResearchItemsGrouped } from "@/storage/research";
import mongoose from "mongoose";
import Link from "next/link";
import { getItemByKey, getItemTitle } from "@/storage/items";
import { getExperimentByKey, getExperimentTitle } from "@/storage/experiments";
import { getPaperById } from "@/storage/papers";
import { getSectionById } from "@/storage/sections";
import { getBlockById } from "@/storage/blocks";

const kindLabels: Record<string, string> = {
  experiment: "Experiments",
  paper: "Papers",
  section: "Sections",
  block: "Blocks",
  item: "Items",
};

const getDisplayTitle = async ({
  kind,
  itemId,
  paperId,
}: {
  kind: string;
  itemId: string;
  paperId?: string;
}) => {
  if (kind === "paper") {
    const paper = await getPaperById(itemId);
    return paper?.title ?? "Untitled paper";
  }
  if (kind === "section" && paperId) {
    const section = await getSectionById(paperId, itemId);
    return section?.title ?? "Untitled section";
  }
  if (kind === "block" && paperId) {
    const block = await getBlockById(paperId, itemId);
    return block?.type ? `${block.type} block` : "Block";
  }
  if (kind === "experiment" && paperId) {
    const experiment = await getExperimentByKey(paperId, itemId);
    return experiment ? getExperimentTitle(experiment) : "Untitled experiment";
  }
  if (kind === "item" && paperId) {
    const item = await getItemByKey(paperId, itemId);
    return item ? getItemTitle(item) : "Untitled item";
  }
  return "Untitled item";
};

export default async function ResearchCollectionPage({
  params,
}: {
  params: { researchId: string };
}) {
  params = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <>
        <DashboardTopBar
          title="Research collection"
          subtitle="Grouped items inside your research collection."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Sign in to view this collection.
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
          title="Research collection"
          subtitle="Grouped items inside your research collection."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          User not found.
        </div>
      </>
    );
  }

  const grouped = await listResearchItemsGrouped(
    user._id,
    new mongoose.Types.ObjectId(params.researchId),
  );

  const displayCache = new Map<string, string>();
  const getCachedTitle = async (key: string, fetcher: () => Promise<string>) => {
    if (displayCache.has(key)) {
      return displayCache.get(key) as string;
    }
    const title = await fetcher();
    displayCache.set(key, title);
    return title;
  };

  const displayTitles = await Promise.all(
    Object.entries(grouped).flatMap(([kind, items]) =>
      items.map(async (item) => {
        const title = await getCachedTitle(
          `${kind}:${item.paperId ?? "np"}:${item.itemId}`,
          () =>
            getDisplayTitle({
              kind,
              itemId: item.itemId,
              paperId: item.paperId,
            }),
        );
        return {
          kind,
          itemId: item.itemId,
          paperId: item.paperId,
          title,
        };
      }),
    ),
  );

  const titleMap = displayTitles.reduce<Record<string, string>>((acc, entry) => {
    acc[`${entry.kind}:${entry.paperId ?? "np"}:${entry.itemId}`] = entry.title;
    return acc;
  }, {});

  return (
    <>
      <DashboardTopBar
        title="Research collection"
        subtitle="Grouped items inside your research collection."
      />
      <div className="space-y-6">
        {Object.entries(grouped).map(([kind, items]) => (
          <section
            key={kind}
            className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-neutral-400">Group</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  {kindLabels[kind] ?? kind}
                </h3>
              </div>
              <span className="text-xs text-neutral-500">
                {items.length} items
              </span>
            </div>
            {items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                Nothing added yet.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {items.map((item) => {
                  const openHref =
                    kind === "experiment" && item.paperId
                      ? `/dashboard/experiments/${item.paperId}/${item.itemId}`
                      : kind === "item" && item.paperId
                        ? `/dashboard/items/${item.paperId}/${item.itemId}`
                        : kind === "paper"
                          ? `/dashboard/papers/${item.itemId}`
                          : kind === "section" && item.paperId
                            ? `/dashboard/sections/${item.paperId}/${item.itemId}`
                            : kind === "block" && item.paperId
                              ? `/dashboard/blocks/${item.paperId}/${item.itemId}`
                              : undefined;

                  const title =
                    titleMap[`${kind}:${item.paperId ?? "np"}:${item.itemId}`] ??
                    "Untitled";

                  return (
                    <div
                      key={`${item.kind}-${item.itemId}`}
                      className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
                    >
                      <p className="text-xs uppercase text-neutral-400">
                        {item.kind}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">
                        {title}
                      </p>
                      {item.notes ? (
                        <p className="mt-2 text-xs text-neutral-500">
                          {item.notes}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-2">
                        {openHref ? (
                          <Link
                            className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                            href={openHref}
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
