import type { ReactNode } from "react";
import { GradientHeader } from "@/components/gradient-header";

interface StandardCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  cta?: ReactNode;
}

export function StandardCard({
  title,
  subtitle,
  badge,
  meta,
  cta,
}: StandardCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
      <GradientHeader title={title} subtitle={subtitle} badge={badge} />
      <div className="space-y-3 p-4">
        {meta}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-neutral-600">{subtitle}</div>
          {cta}
        </div>
      </div>
    </article>
  );
}
