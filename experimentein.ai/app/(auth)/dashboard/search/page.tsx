"use client";

import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { searchExperiments } from "@/storage/actions";

const modes = ["Papers", "Sections", "Blocks", "Experiments"] as const;
const sortModes = ["Relevance", "Recent", "Confidence"] as const;
const filters = ["High confidence", "Has evidence", "Missing fields"] as const;

type Mode = (typeof modes)[number];

type SortMode = (typeof sortModes)[number];

type Filter = (typeof filters)[number];

type ExperimentRow = {
  experiment_id?: string;
  experiment_type?: string;
  summary?: string;
};

export default function DashboardSearchPage() {
  const [activeMode, setActiveMode] = useState<Mode>("Experiments");
  const [activeSort, setActiveSort] = useState<SortMode>("Relevance");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExperimentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFilter = (filter: Filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]
    );
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = (await searchExperiments(query)) as ExperimentRow[];
      console.log(data);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <DashboardShell>
        <DashboardTopBar
          title="Search"
          subtitle="Find experiments, papers, and evidence fast."
        />
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full gap-2 md:max-w-lg">
                <input
                  type="text"
                  placeholder="Search experiments, papers, proteins..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                />
                <button type="button" className="btn-primary" onClick={handleSearch}>
                  {isLoading ? "Searching" : "Search"}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
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
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {results.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No results yet. Run a search to see experiments.
              </div>
            ) : null}
            {results.map((result) => (
              <div
                key={result.experiment_id ?? result.summary}
                className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-neutral-400">
                      {result.experiment_type ?? "Experiment"}
                    </p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {result.experiment_id ?? "Experiment"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-neutral-900 px-2 py-1 text-[11px] text-white">
                      Result
                    </span>
                    {result.experiment_id ? (
                      <a
                        className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                        href={`/dashboard/experiments/${result.experiment_id}`}
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">{result.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </DashboardShell>
      <SiteFooter />
    </div>
  );
}
