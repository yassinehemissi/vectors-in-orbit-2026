interface UsageChartProps {
  title: string;
}

export function UsageChart({ title }: UsageChartProps) {
  const data = [120, 240, 180, 320, 90, 260, 220];
  const max = Math.max(...data);
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <span className="text-xs text-neutral-500">Last 7 days</span>
      </div>
      <div className="mt-5 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">
        <div className="flex h-32 items-end gap-3">
          {data.map((value, index) => (
            <div key={`bar-${index}`} className="flex-1">
              <div
                className="mx-auto w-3 rounded-full bg-neutral-900"
                style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
              />
              <p className="mt-2 text-center text-[10px] text-neutral-400">
                D{index + 1}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
          <span>Peak usage {max} credits</span>
          <span>Avg {Math.round(data.reduce((a, b) => a + b, 0) / data.length)}</span>
        </div>
      </div>
    </div>
  );
}
