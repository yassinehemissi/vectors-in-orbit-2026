import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";

const savedCollections = [
  {
    title: "Protein stability",
    count: 12,
    updated: "2 hours ago",
  },
  {
    title: "CRISPR methods",
    count: 8,
    updated: "Yesterday",
  },
  {
    title: "Microfluidics",
    count: 5,
    updated: "Last week",
  },
];

export default function DashboardSavedPage() {
  return (
    <>
      <DashboardTopBar
        title="Saved"
        subtitle="Your saved experiments and collections."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {savedCollections.map((collection) => (
          <div
            key={collection.title}
            className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm"
          >
            <p className="text-xs uppercase text-neutral-400">Collection</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              {collection.title}
            </h3>
            <p className="mt-2 text-xs text-neutral-500">
              {collection.count} experiments · Updated {collection.updated}
            </p>
            <button type="button" className="btn-secondary mt-4">
              Open collection
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
