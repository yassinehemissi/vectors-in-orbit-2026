'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface UsageChartProps {
  title: string;
  data?: number[];
  labels?: string[];
}

export function UsageChart({ title, data = [], labels = [] }: UsageChartProps) {
  const series = data.length ? data : [];
  if (!series.length) {
    return (
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <span className="text-xs text-neutral-500">Last 7 days</span>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-neutral-200/70 bg-neutral-50 p-6 text-sm text-neutral-500">
          No usage data yet.
        </div>
      </div>
    );
  }
  const chartData = series.map((value, index) => ({
    day: labels[index] ? labels[index].slice(5) : `D${index + 1}`,
    credits: value,
  }));
  const max = Math.max(...series);
  const avg = Math.round(series.reduce((a, b) => a + b, 0) / series.length);

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <span className="text-xs text-neutral-500">Last 7 days</span>
      </div>
      <div className="mt-5 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">
        <ChartContainer
          config={{
            credits: {
              label: "Credits",
              color: "var(--chart-1)",
            },
          }}
          className="h-40"
        >
          <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--color-chart-3)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--color-chart-3)" }}
              width={32}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="credits" fill="var(--color-credits)" radius={6} />
          </BarChart>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
          <span>Peak usage {max} credits</span>
          <span>Avg {avg}</span>
        </div>
      </div>
    </div>
  );
}
