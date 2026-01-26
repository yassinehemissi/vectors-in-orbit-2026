import type { ReactNode } from "react";

interface BottomNavItem {
  label: string;
  active?: boolean;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

function NavIcon({ active }: { active?: boolean }) {
  return (
    <span
      className={`h-6 w-6 rounded-full ${
        active ? "bg-neutral-900" : "bg-neutral-300"
      }`}
      aria-hidden="true"
    />
  );
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav className="fixed bottom-5 left-1/2 z-20 w-[min(430px,calc(100vw-40px))] -translate-x-1/2">
      <div className="flex items-center justify-between rounded-2xl border border-neutral-200/70 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex flex-col items-center gap-1 text-[11px] text-neutral-500"
          >
            <NavIcon active={item.active} />
            <span className={item.active ? "text-neutral-900" : undefined}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
