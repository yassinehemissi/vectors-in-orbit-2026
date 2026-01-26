"use client";

interface SidebarItem {
  label: string;
  href: string;
  active?: boolean;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  onNavigate?: () => void;
}

export function DashboardSidebar({ items, onNavigate }: DashboardSidebarProps) {
  return (
    <aside className="flex h-full flex-col gap-6 rounded-[28px] border border-neutral-200/70 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Experimentein.ai" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-400">Workspace</p>
          <p className="text-sm font-semibold text-neutral-900">Experimentein</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-2xl px-4 py-2 transition ${
              item.active
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4 text-xs text-neutral-600">
        Tip: Keep evidence linked to every decision.
      </div>
    </aside>
  );
}
