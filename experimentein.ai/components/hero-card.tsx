import type { ReactNode } from "react";
import { GradientHeader } from "@/components/gradient-header";

interface HeroCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children?: ReactNode;
}

export function HeroCard({ title, subtitle, badge, children }: HeroCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
      <GradientHeader title={title} subtitle={subtitle} badge={badge} size="lg" />
      <div className="space-y-3 p-4">
        {children}
      </div>
    </article>
  );
}
