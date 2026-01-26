import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { CreditBalanceCard } from "@/components/dashboard/credit-balance-card";
import { mockCreditSummary } from "@/lib/credits/mock";

export default function DashboardCreditsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <DashboardShell>
        <DashboardTopBar
          title="Credits"
          subtitle="Track balances, reservations, and usage receipts."
        />
        <CreditBalanceCard summary={mockCreditSummary} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900">Ledger</h3>
            <div className="mt-4 space-y-3 text-xs text-neutral-600">
              {mockCreditSummary.recentLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">{entry.reason}</span>
                    <span className={entry.delta < 0 ? "text-red-600" : "text-emerald-600"}>
                      {entry.delta > 0 ? "+" : ""}{entry.delta}
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
            <h3 className="text-lg font-semibold text-neutral-900">Usage receipts</h3>
            <div className="mt-4 space-y-3 text-xs text-neutral-600">
              {mockCreditSummary.recentReceipts.map((receipt) => (
                <div
                  key={receipt.requestId}
                  className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">{receipt.actionType}</span>
                    <span className="text-neutral-900">{receipt.creditsCharged} credits</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase text-neutral-400">
                    {receipt.model} · {receipt.inputTokens + receipt.outputTokens} tokens
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardShell>
      <SiteFooter />
    </div>
  );
}
