"use client";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { CreditBalanceCard } from "@/components/dashboard/credit-balance-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { mockCreditSummary } from "@/lib/credits/mock";

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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <DashboardShell>
        <DashboardTopBar
          title="Command center"
          subtitle="Track experiments, evidence, and credit usage at a glance."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active projects" value="6" helper="Across 3 workspaces" />
          <StatCard label="Experiments viewed" value="184" helper="Past 30 days" />
          <StatCard label="Evidence linked" value="98%" helper="Across saved items" />
        </div>
        <CreditBalanceCard summary={mockCreditSummary} />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <UsageChart title="Credit usage" />
          <ActivityCard items={activityItems} />
        </div>
      </DashboardShell>
      <SiteFooter />
    </div>
  );
}
