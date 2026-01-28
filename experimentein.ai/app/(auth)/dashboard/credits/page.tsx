import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { CreditBalanceCard } from "@/components/dashboard/credit-balance-card";
import { getCreditSummary, getCreditUsageSeries } from "@/lib/credits";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { UsageChart } from "@/components/dashboard/usage-chart";

export default async function DashboardCreditsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <>
        <DashboardTopBar
          title="Credits"
          subtitle="Track balances, reservations, and usage receipts."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Sign in to see credit activity.
        </div>
      </>
    );
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  const summary = user ? await getCreditSummary(user._id) : null;
  const usageSeries = user ? await getCreditUsageSeries(user._id, 7) : null;

  if (!summary) {
    return (
      <>
        <DashboardTopBar
          title="Credits"
          subtitle="Track balances, reservations, and usage receipts."
        />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          No credit account found yet.
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopBar
        title="Credits"
        subtitle="Track balances, reservations, and usage receipts."
      />
      <CreditBalanceCard summary={summary} />
      <UsageChart
        title="Credit usage"
        data={usageSeries?.data}
        labels={usageSeries?.labels}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Ledger</h3>
          <div className="mt-4 space-y-3 text-xs text-neutral-600">
            {summary.recentLedger.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                No ledger activity yet.
              </div>
            ) : null}
            {summary.recentLedger.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">
                    {entry.reason}
                  </span>
                  <span
                    className={
                      entry.delta < 0 ? "text-red-600" : "text-emerald-600"
                    }
                  >
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                </div>
                <p className="mt-1 text-[11px] uppercase text-neutral-400">
                  {entry.requestId} · {entry.timestamp}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">
            Usage receipts
          </h3>
          <div className="mt-4 space-y-3 text-xs text-neutral-600">
            {summary.recentReceipts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                No usage receipts yet.
              </div>
            ) : null}
            {summary.recentReceipts.slice(0, 3).map((receipt) => (
              <div
                key={receipt.requestId}
                className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">
                    {receipt.actionType}
                  </span>
                  <span className="text-neutral-900">
                    {receipt.creditsCharged} credits
                  </span>
                </div>
                <p className="mt-1 text-[11px] uppercase text-neutral-400">
                  {receipt.model} · {receipt.inputTokens + receipt.outputTokens}{" "}
                  tokens
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
