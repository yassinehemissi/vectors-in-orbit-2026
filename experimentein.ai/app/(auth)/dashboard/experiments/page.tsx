"use client";

import { useState } from "react";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";

const experiments = [
  {
    paperId: "paper_001",
    experimentId: "exp_001",
    title: "Protein stability shift",
    status: "High confidence",
    missing: "Dataset",
  },
  {
    paperId: "paper_002",
    experimentId: "exp_002",
    title: "CRISPR activation rescue",
    status: "Medium confidence",
    missing: "Baselines",
  },
  {
    paperId: "paper_003",
    experimentId: "exp_003",
    title: "Microfluidics kinetics",
    status: "Low confidence",
    missing: "Ablations",
  },
];

const filters = [
  "All",
  "High confidence",
  "Missing fields",
  "Needs review",
] as const;
const sortModes = ["Updated", "Confidence"] as const;

type Filter = (typeof filters)[number];

type SortMode = (typeof sortModes)[number];

export default function DashboardExperimentsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [activeSort, setActiveSort] = useState<SortMode>("Updated");

  return (
    <>
      <DashboardTopBar
        title="Experiments"
        subtitle="Organize and review experiment cards."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 text-xs">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 ${
                  activeFilter === filter
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200/70 text-neutral-600"
                }`}
              >
                {filter}
              </button>
            ))}
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
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {experiments.map((experiment) => (
            <div
              key={`${experiment.paperId}-${experiment.experimentId}`}
              className="rounded-3xl border border-neutral-200/70 bg-neutral-50 p-6"
            >
              <p className="text-xs uppercase text-neutral-400">Experiment</p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                {experiment.title}
              </h3>
              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                <span className="rounded-full bg-neutral-900 px-2 py-1 text-white">
                  {experiment.status}
                </span>
                <span className="rounded-full border border-neutral-200/70 px-2 py-1">
                  Missing: {experiment.missing}
                </span>
              </div>
              <a
                className="btn-secondary mt-4 inline-flex"
                href={`/dashboard/experiments/${experiment.paperId}/${experiment.experimentId}`}
              >
                Open card
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
