"use client";

import { ActivityCard } from "@/components/dashboard/activity-card";
import { CreditBalanceCard } from "@/components/dashboard/credit-balance-card";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { mockCreditSummary } from "@/lib/credits/mock";
import Link from "next/link";

const activityItems = [
  {
    title: "Filled missing results",
    detail: "Protein stability shift in glycolytic mutants",
    time: "2 hours ago",
  },
  {
    title: "Compared two experiments",
    detail: "CRISPR activation vs baseline controls",
    time: "Yesterday",
  },
  {
    title: "Generated evidence summary",
    detail: "Methods block 12 + Results block 7",
    time: "2 days ago",
  },
];

export default function DashboardPage() {
  return (
    <>
      <DashboardTopBar
        title="Command center"
        subtitle="Track experiments, evidence, and credit usage at a glance."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active projects"
          value="6"
          helper="Across 3 workspaces"
        />
        <StatCard
          label="Experiments viewed"
          value="184"
          helper="Past 30 days"
        />
        <StatCard
          label="Evidence linked"
          value="98%"
          helper="Across saved items"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <CreditBalanceCard summary={mockCreditSummary} />
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Quick actions</h3>
            <span className="text-xs text-neutral-500">Power user flow</span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Link className="btn-primary" href="/dashboard/search">
              Run a new search
            </Link>
            <Link className="btn-secondary" href="/dashboard/experiments">
              Compare experiments
            </Link>
            <Link className="btn-secondary" href="/dashboard/saved">
              Review saved items
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 p-4 text-xs text-neutral-500">
            Tip: Save an experiment to build evidence packs for reports.
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <UsageChart title="Credit usage" />
        <ActivityCard items={activityItems} />
      </div>
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Saved highlights</h3>
          <Link className="btn-secondary text-xs" href="/dashboard/saved">
            View all saved
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Protein stability under oxidative stress",
              detail: "Experiment bundle · Evidence score 0.92",
            },
            {
              title: "Gene therapy delivery accuracy",
              detail: "Paper snapshot · 12 linked blocks",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
            >
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
