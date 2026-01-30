"use client";

import { useEffect, useState } from "react";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { searchContent } from "@/storage/search";
import Link from "next/link";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import { useSearchParams } from "next/navigation";

const modes = ["Papers", "Sections", "Blocks", "Items"] as const;
const sortModes = ["Relevance", "Recent", "Confidence"] as const;
const filters = ["High confidence", "Has evidence", "Missing fields"] as const;
const tabs = ["Live search", "History"] as const;
const itemKinds = [
  "all",
  "experiment",
  "method",
  "claim",
  "dataset",
  "resource",
  "negative_result",
] as const;

type Mode = (typeof modes)[number];

type SortMode = (typeof sortModes)[number];

type Filter = (typeof filters)[number];
type Tab = (typeof tabs)[number];
type ItemKind = (typeof itemKinds)[number];

type SearchResult = Awaited<ReturnType<typeof searchContent>>[number];

const tagLabel = (tag?: string) => {
  if (!tag) return "Result";
  if (tag === "experiment") return "Study";
  return tag.replace(/_/g, " ");
};

const itemKindLabel = (kind: ItemKind) => {
  if (kind === "all") return "All kinds";
  if (kind === "experiment") return "Study";
  return kind.replace(/_/g, " ");
};

export default function DashboardSearchClient() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("Live search");
  const [activeMode, setActiveMode] = useState<Mode>("Items");
  const [activeSort, setActiveSort] = useState<SortMode>("Relevance");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [activeItemKind, setActiveItemKind] = useState<ItemKind>("all");
  const [query, setQuery] = useState("");
  const [rawResults, setRawResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
      setRawResults([]);
      return;
    }
    setIsLoading(true);
    setRawResults([]);
    try {
      const data = await searchContent(
        query,
        activeMode.toLowerCase() as SearchResult["kind"],
      );
      setRawResults(data);
      void saveHistory(data);
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
    if (activeTab === "Live search") {
      setRawResults([]);
    }
  }, [activeMode, activeTab]);

  useEffect(() => {
    if (activeMode !== "Items") {
      setActiveItemKind("all");
    }
  }, [activeMode]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (!modeParam) return;
    const normalized = `${modeParam.charAt(0).toUpperCase()}${modeParam.slice(1)}`;
    if (modes.includes(normalized as Mode)) {
      setActiveMode(normalized as Mode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== "History") return;
    setHistoryLoading(true);
    fetch("/api/search/history")
      .then((res) => res.json())
      .then((payload) => {
        setHistory(Array.isArray(payload.history) ? payload.history : []);
      })
      .finally(() => setHistoryLoading(false));
  }, [activeTab]);

  const saveHistory = async (data: SearchResult[]) => {
    const payload = {
      query,
      mode: activeMode.toLowerCase(),
      filters: activeFilters,
      sort: activeSort,
      results: data.map((item) => ({
        kind: item.kind,
        id: item.id,
        paperId: item.paperId,
        sectionId: item.sectionId,
        blockId: item.blockId,
      })),
    };
    await fetch("/api/search/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const loadHistory = async (historyId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/history/${historyId}`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        history?: any;
        results?: SearchResult[];
      };
      const results = Array.isArray(payload.results) ? payload.results : [];
      setRawResults(results);
      if (payload.history) {
        setQuery(payload.history.query ?? "");
        const modeLabel = (payload.history.mode ?? "items") as string;
        const normalizedMode =
          modeLabel.charAt(0).toUpperCase() + modeLabel.slice(1);
        if (modes.includes(normalizedMode as Mode)) {
          setActiveMode(normalizedMode as Mode);
        }
      }
      const uniquePapers = Array.from(
        new Set(results.map((item) => item.paperId).filter(Boolean) as string[]),
      );
      if (uniquePapers.length) {
        const titlesResponse = await fetch(
          `/api/papers/titles?ids=${encodeURIComponent(uniquePapers.join(","))}`,
        );
        if (titlesResponse.ok) {
          const titlesPayload = (await titlesResponse.json()) as {
            titles: Record<string, string>;
          };
          setPaperTitles(titlesPayload.titles ?? {});
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = rawResults.filter((result) => {
    if (activeFilters.includes("High confidence")) {
      if (typeof result.confidence !== "number" || result.confidence < 0.75) {
        return false;
      }
    }
    if (activeFilters.includes("Has evidence")) {
      if (!result.evidenceCount || result.evidenceCount <= 0) {
        return false;
      }
    }
    if (activeFilters.includes("Missing fields")) {
      if (!result.missingFields) {
        return false;
      }
    }
    if (activeMode === "Items" && activeItemKind !== "all") {
      if (result.tag !== activeItemKind) {
        return false;
      }
    }
    return true;
  });

  const sortedResults = (() => {
    if (activeSort !== "Confidence") return filteredResults;
    return [...filteredResults].sort((a, b) => {
      const aScore = typeof a.confidence === "number" ? a.confidence : -1;
      const bScore = typeof b.confidence === "number" ? b.confidence : -1;
      return bScore - aScore;
    });
  })();

  const hasQuery = query.trim().length > 0;
  const hasResults = sortedResults.length > 0;
  const showEmpty = !isLoading && !hasResults;

  return (
    <>
      <DashboardTopBar
        title="Search"
        subtitle="Find items, papers, and evidence fast."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 ${
                activeTab === tab
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200/70 text-neutral-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex w-full flex-col gap-3 md:max-w-2xl">
              <label className="text-xs uppercase text-neutral-400">
                Search query
              </label>
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  placeholder="Search items, papers, sections..."
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
                Semantic search across indexed papers and items.
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
          {activeMode === "Items" ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-500">Item kind</span>
              {itemKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setActiveItemKind(kind)}
                  className={`rounded-full px-3 py-1 ${
                    activeItemKind === kind
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-200/70 text-neutral-600"
                  }`}
                >
                  {itemKindLabel(kind)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {activeTab === "History" ? (
          <div className="mt-6 space-y-3">
            {historyLoading ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                Loading history...
              </div>
            ) : null}
            {!historyLoading && history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No saved searches yet.
              </div>
            ) : null}
            {!historyLoading
              ? history.map((entry) => (
                  <button
                    key={entry._id}
                    type="button"
                    onClick={() => loadHistory(entry._id)}
                    className="w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4 text-left transition hover:border-neutral-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase text-neutral-400">
                          {entry.mode}
                        </p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {entry.query}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {entry.resultCount ?? entry.results?.length ?? 0} results
                      </span>
                    </div>
                    {entry.filters?.length ? (
                      <p className="mt-2 text-xs text-neutral-500">
                        Filters: {entry.filters.join(", ")}
                      </p>
                    ) : null}
                  </button>
                ))
              : null}
          </div>
        ) : null}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {hasResults
                ? `${sortedResults.length} results`
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
                : "No results yet. Run a search to see items."}
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
            ? sortedResults.map((result) => {
                const openHref =
                  result.kind === "items" && result.paperId
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
                          {result.title ?? "Untitled result"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {result.paperId
                            ? `Paper: ${
                                paperTitles[result.paperId] ??
                                "Untitled paper"
                              }`
                            : "Paper: N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-2 py-1 text-[11px] text-white">
                          {tagLabel(result.tag)}
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
                              result.kind === "items"
                                ? "item"
                                : result.kind === "papers"
                                  ? "paper"
                                  : result.kind === "sections"
                                    ? "section"
                                    : "block"
                            }
                            itemId={
                              result.kind === "items"
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
