"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from "recharts";

type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactNode;
};

const chartIdPrefix = "chart";

function cn(...inputs: Array<string | undefined | false>) {
  return inputs.filter(Boolean).join(" ");
}

function chartCss(config: ChartConfig, chartId: string) {
  const entries = Object.entries(config).filter(([, value]) => value.color);
  if (!entries.length) return "";

  const vars = entries
    .map(([key, value]) => `--color-${key}: ${value.color};`)
    .join("");
  return `#${chartId}{${vars}}`;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const chartId = React.useId().replace(/:/g, "");
  const scopedId = `${chartIdPrefix}-${chartId}`;

  return (
    <div
      data-chart={scopedId}
      id={scopedId}
      className={cn("w-full", className)}
      {...props}
    >
      <style>{chartCss(config, scopedId)}</style>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
}

export function ChartTooltip(props: React.ComponentProps<typeof RechartsTooltip>) {
  return <RechartsTooltip cursor={false} {...props} />;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  hideLabel?: boolean;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white p-3 text-xs shadow-sm">
      {!hideLabel && label ? (
        <div className="mb-1 text-[11px] uppercase text-neutral-400">{label}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.dataKey ?? item.name}-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color ?? "var(--chart-1)" }}
            />
            <span className="text-neutral-600">{item.name ?? item.dataKey}</span>
            <span className="font-semibold text-neutral-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend(props: React.ComponentProps<typeof RechartsLegend>) {
  return <RechartsLegend {...props} />;
}

export function ChartLegendContent({
  payload,
}: {
  payload?: Array<{ value?: string; color?: string }>;
}) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
      {payload.map((item) => (
        <div key={item.value} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color ?? "var(--chart-1)" }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
