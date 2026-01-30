"use client";

import { useState } from "react";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { searchContent } from "@/storage/search";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import Link from "next/link";

const kindFilters = [
  "all",
  "experiment",
  "method",
  "claim",
  "dataset",
  "resource",
  "negative_result",
] as const;

type KindFilter = (typeof kindFilters)[number];

type SearchResult = Awaited<ReturnType<typeof searchContent>>[number];

export default function DashboardItemsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeKind, setActiveKind] = useState<KindFilter>("all");
  const [paperTitles, setPaperTitles] = useState<Record<string, string>>({});

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setResults([]);
    try {
      const data = await searchContent(query, "items");
      const filtered =
        activeKind === "all"
          ? data
          : data.filter((item) => item.tag === activeKind);
      setResults(filtered);
      const uniquePapers = Array.from(
        new Set(filtered.map((item) => item.paperId).filter(Boolean) as string[]),
      );
      if (uniquePapers.length) {
        const response = await fetch(
          `/api/papers/titles?ids=${encodeURIComponent(uniquePapers.join(","))}`,
        );
        if (response.ok) {
          const payload = (await response.json()) as {
            titles: Record<string, string>;
          };
          setPaperTitles(payload.titles ?? {});
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DashboardTopBar
        title="Items"
        subtitle="Explore extracted items across papers."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex w-full flex-col gap-3 md:max-w-2xl">
            <label className="text-xs uppercase text-neutral-400">
              Search items
            </label>
            <div className="flex w-full gap-2">
              <input
                type="text"
                placeholder="Search items by label or summary..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleSearch}
                disabled={!query.trim() || isLoading}
              >
                {isLoading ? "Searching" : "Search"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {kindFilters.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveKind(kind)}
                className={`rounded-full px-3 py-1 ${
                  activeKind === kind
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200/70 text-neutral-600"
                }`}
              >
                {kind === "all" ? "All kinds" : kind}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {!isLoading && results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              No items yet. Run a search to see results.
            </div>
          ) : null}
          {results.map((result) => (
            <div
              key={`${result.kind}-${result.paperId ?? "np"}-${result.id}`}
              className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase text-neutral-400">Item</p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {result.title ?? result.id}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {result.paperId
                      ? `Paper: ${paperTitles[result.paperId] ?? "Untitled paper"}`
                      : "Paper: N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-900 px-2 py-1 text-[11px] text-white">
                    {result.tag ?? "Item"}
                  </span>
                  {result.paperId ? (
                    <Link
                      className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                      href={`/dashboard/items/${result.paperId}/${result.id}`}
                    >
                      Open
                    </Link>
                  ) : null}
                  {result.paperId ? (
                    <ResearchSaveButton
                      kind="item"
                      itemId={result.id}
                      paperId={result.paperId}
                    />
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                {result.summary ?? "No summary available."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
