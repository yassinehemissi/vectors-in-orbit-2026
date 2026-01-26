import type { ReactNode } from "react";

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  size?: "sm" | "lg";
}

export function GradientHeader({
  title,
  subtitle,
  badge,
  size = "sm",
}: GradientHeaderProps) {
  const heightClass = size === "lg" ? "h-36" : "h-24";

  return (
    <div
      className={`relative ${heightClass} bg-gradient-to-r from-fuchsia-600/60 via-indigo-600/50 to-cyan-500/60`}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        <div className="flex justify-end">{badge}</div>
        <div>
          <p className="text-lg font-semibold drop-shadow-sm">{title}</p>
          {subtitle ? (
            <p className="text-sm text-white/80 drop-shadow-sm">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
