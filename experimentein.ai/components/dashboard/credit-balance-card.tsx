import type { CreditSummary } from "@/lib/credits/types";

interface CreditBalanceCardProps {
  summary: CreditSummary;
}

export function CreditBalanceCard({ summary }: CreditBalanceCardProps) {
  const available = summary.account.balance - summary.account.reserved;
  const total = summary.account.balance || 0;
  const reservedPercent = total > 0 ? (summary.account.reserved / total) * 100 : 0;
  const availablePercent = total > 0 ? (available / total) * 100 : 0;

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Credits</h3>
        <button type="button" className="btn-secondary text-xs">
          Buy credits
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">
          <p className="text-xs uppercase text-neutral-400">Balance</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {summary.account.balance}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">
          <p className="text-xs uppercase text-neutral-400">Reserved</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {summary.account.reserved}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">
          <p className="text-xs uppercase text-neutral-400">Available</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{available}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Usage distribution</span>
          <span>{available} available</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="flex h-full w-full">
            <div
              className="h-full bg-neutral-400"
              style={{ width: `${reservedPercent}%` }}
            />
            <div
              className="h-full bg-neutral-900"
              style={{ width: `${availablePercent}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <span>1 credit = 1,000 tokens</span>
        <span>Usage updates in real time</span>
      </div>
    </div>
  );
}
