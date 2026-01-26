interface UsageChartProps {
  title: string;
}

export function UsageChart({ title }: UsageChartProps) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <span className="text-xs text-neutral-500">Last 7 days</span>
      </div>
      <div className="mt-4 grid h-40 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
        Usage chart placeholder
      </div>
    </div>
  );
}
