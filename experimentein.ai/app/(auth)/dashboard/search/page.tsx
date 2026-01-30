"use client";

import { useEffect, useState } from "react";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { searchContent } from "@/storage/search";
import Link from "next/link";
import { ResearchSaveButton } from "@/components/dashboard/research-save";

const modes = ["Papers", "Sections", "Blocks", "Items", "Experiments"] as const;
const sortModes = ["Relevance", "Recent", "Confidence"] as const;
const filters = ["High confidence", "Has evidence", "Missing fields"] as const;

type Mode = (typeof modes)[number];

type SortMode = (typeof sortModes)[number];

type Filter = (typeof filters)[number];

type SearchResult = Awaited<ReturnType<typeof searchContent>>[number];

const truncateId = (value?: string, keep = 10) => {
  if (!value) return "N/A";
  if (value.length <= keep * 2) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
};

export default function DashboardSearchPage() {
  const [activeMode, setActiveMode] = useState<Mode>("Experiments");
  const [activeSort, setActiveSort] = useState<SortMode>("Relevance");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [paperTitles, setPaperTitles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const clearFilters = () => setActiveFilters([]);

  const toggleFilter = (filter: Filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((item) => item !== filter)
        : [...prev, filter],
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setResults([]);
    try {
      const data = await searchContent(
        query,
        activeMode.toLowerCase() as SearchResult["kind"],
      );
      setResults(data);
      const uniquePapers = Array.from(
        new Set(data.map((item) => item.paperId).filter(Boolean) as string[]),
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

  useEffect(() => {
    setResults([]);
  }, [activeMode, activeSort, activeFilters]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;
  const showEmpty = !isLoading && !hasResults;

  return (
    <>
      <DashboardTopBar
        title="Search"
        subtitle="Find experiments, papers, and evidence fast."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex w-full flex-col gap-3 md:max-w-2xl">
              <label className="text-xs uppercase text-neutral-400">
                Search query
              </label>
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  placeholder="Search experiments, papers, sections..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSearch}
                  disabled={!hasQuery || isLoading}
                >
                  {isLoading ? "Searching" : "Search"}
                </button>
              </div>
              <p className="text-xs text-neutral-500">
                Semantic search across indexed papers and experiments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-500">Sort by</span>
              {sortModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveSort(mode)}
                  className={`rounded-full px-3 py-1 ${
                    activeSort === mode
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-200/70 text-neutral-600"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`rounded-full px-3 py-1 ${
                  activeMode === mode
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200/70 text-neutral-600"
                }`}
              >
                {mode}
              </button>
            ))}
            <span className="ml-2 text-neutral-500">Filters</span>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => toggleFilter(filter)}
                className={`rounded-full px-3 py-1 ${
                  activeFilters.includes(filter)
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200/70 text-neutral-600"
                }`}
              >
                {filter}
              </button>
            ))}
            {activeFilters.length ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-neutral-200/70 px-3 py-1 text-neutral-600"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {hasResults
                ? `${results.length} results`
                : hasQuery
                  ? "No results yet"
                  : "Start with a search"}
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-neutral-200/70 px-3 py-1">
                Mode: {activeMode}
              </span>
              <span className="rounded-full border border-neutral-200/70 px-3 py-1">
                Sort: {activeSort}
              </span>
            </div>
          </div>
          {showEmpty ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              {hasQuery
                ? "No results found. Try adjusting your query or filters."
                : "No results yet. Run a search to see experiments."}
            </div>
          ) : null}
          {isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-20 animate-pulse rounded-2xl border border-neutral-200/70 bg-neutral-50"
                />
              ))}
            </div>
          ) : null}
          {!isLoading
            ? results.map((result) => {
                const openHref =
                  result.kind === "experiments" &&
                  result.experimentId &&
                  result.paperId
                    ? `/dashboard/experiments/${result.paperId}/${result.experimentId}`
                    : result.kind === "items" && result.paperId
                      ? `/dashboard/items/${result.paperId}/${result.id}`
                      : result.kind === "papers" && result.paperId
                        ? `/dashboard/papers/${result.paperId}`
                        : result.kind === "sections" &&
                            result.paperId &&
                            result.sectionId
                          ? `/dashboard/sections/${result.paperId}/${result.sectionId}`
                          : result.kind === "blocks" &&
                              result.paperId &&
                              result.blockId
                            ? `/dashboard/blocks/${result.paperId}/${result.blockId}`
                            : undefined;

                return (
                  <div
                    key={`${result.kind}-${result.paperId ?? "np"}-${result.id}`}
                    className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase text-neutral-400">
                          {result.kind}
                        </p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {result.title ?? result.id}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {result.paperId
                            ? `Paper: ${
                                paperTitles[result.paperId] ??
                                truncateId(result.paperId)
                              }`
                            : "Paper: N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-2 py-1 text-[11px] text-white">
                          {result.tag ?? "Result"}
                        </span>
                        {openHref ? (
                          <Link
                            className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                            href={openHref}
                          >
                            Open
                          </Link>
                        ) : null}
                        {result.kind && result.id ? (
                          <ResearchSaveButton
                            kind={
                              result.kind === "experiments"
                                ? "experiment"
                                : result.kind === "items"
                                  ? "item"
                                : result.kind === "papers"
                                  ? "paper"
                                  : result.kind === "sections"
                                    ? "section"
                                    : "block"
                            }
                            itemId={
                              result.kind === "experiments"
                                ? result.experimentId ?? result.id
                                : result.kind === "items"
                                  ? result.id
                                : result.kind === "papers"
                                  ? result.paperId ?? result.id
                                  : result.kind === "sections"
                                    ? result.sectionId ?? result.id
                                    : result.blockId ?? result.id
                            }
                            paperId={result.paperId}
                          />
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">
                      {result.summary ?? "No summary available."}
                    </p>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </>
  );
}
