import { ActivityCard } from "@/components/dashboard/activity-card";
import { CreditBalanceCard } from "@/components/dashboard/credit-balance-card";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { getCreditSummary, getCreditUsageSeries } from "@/lib/credits";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { Research } from "@/models/Research";
import { ResearchItem } from "@/models/ResearchItem";
import { listRecentActivity } from "@/storage/activity";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  let summary = null;
  let researchCount = 0;
  let researchItemCount = 0;
  let highlights: Array<{ title: string; detail: string }> = [];
  let activityItems: Array<{ title: string; detail: string; time: string }> = [];
  let usageSeries: { labels: string[]; data: number[] } | null = null;

  if (email) {
    await connectToDatabase();
    const user = await User.findOne({ email });
    summary = user ? await getCreditSummary(user._id) : null;
    if (user) {
      researchCount = await Research.countDocuments({ userId: user._id });
      researchItemCount = await ResearchItem.countDocuments({ userId: user._id });
      activityItems = await listRecentActivity(user._id, 3);
      usageSeries = await getCreditUsageSeries(user._id, 7);

      const recent = await Research.find({ userId: user._id })
        .sort({ updatedAt: -1 })
        .limit(2)
        .lean();

      highlights = await Promise.all(
        recent.map(async (research) => {
          const count = await ResearchItem.countDocuments({
            researchId: research._id,
          });
          return {
            title: research.title,
            detail: `${count} saved items`,
          };
        }),
      );
    }
  }

  return (
    <>
      <DashboardTopBar
        title="Command center"
        subtitle="Track experiments, evidence, and credit usage at a glance."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active research"
          value={researchCount.toString()}
          helper="Across your collections"
        />
        <StatCard
          label="Saved items"
          value={researchItemCount.toString()}
          helper="Across all research"
        />
        <StatCard
          label="Evidence linked"
          value="98%"
          helper="Across research collections"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        {summary ? (
          <CreditBalanceCard summary={summary} />
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
            Connect your account to see live credits.
          </div>
        )}
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
            <Link className="btn-secondary" href="/dashboard/research">
              Review research
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 p-4 text-xs text-neutral-500">
            Tip: Save an experiment to build evidence packs for reports.
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <UsageChart
          title="Credit usage"
          data={usageSeries?.data}
          labels={usageSeries?.labels}
        />
        <ActivityCard
          items={
            activityItems.length
              ? activityItems
              : [
                  {
                    title: "No activity yet",
                    detail: "Create research or save items to see updates here.",
                    time: "—",
                  },
                ]
          }
        />
      </div>
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            Research highlights
          </h3>
          <Link className="btn-secondary text-xs" href="/dashboard/research">
            View all research
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {highlights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
              No research collections yet.
            </div>
          ) : null}
          {highlights.map((item) => (
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
